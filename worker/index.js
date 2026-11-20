const aliases = {
  "台積電":"2330.TW","2330":"2330.TW","鴻海":"2317.TW","2317":"2317.TW","聯發科":"2454.TW","2454":"2454.TW","台達電":"2308.TW","2308":"2308.TW","0050":"0050.TW","006208":"006208.TW","長榮":"2603.TW","2603":"2603.TW","廣達":"2382.TW","2382":"2382.TW",
  "AAPL":"AAPL","APPLE":"AAPL","NVDA":"NVDA","NVIDIA":"NVDA","TSLA":"TSLA","MSFT":"MSFT","GOOGL":"GOOGL","AMZN":"AMZN","META":"META"
};
const recent = new Map();
const cors = origin => ({"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin"});
const json = (body,status,origin) => new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
function detectSymbols(text){
  const upper=text.toUpperCase(), found=[];
  for(const [name,symbol] of Object.entries(aliases)){
    const re=/^[A-Z0-9]+$/.test(name)?new RegExp("(^|[^A-Z0-9])"+name+"([^A-Z0-9]|$)"):null;
    if(re?re.test(upper):text.includes(name))found.push(symbol);
  }
  for(const value of upper.match(/\b\d{4,6}(?:\.TW|\.TWO)?\b/g)||[])found.push(value.includes(".")?value:value+".TW");
  for(const value of upper.match(/\b[A-Z]{1,5}\b/g)||[])if(!["THE","RSI","ETF","TWD","USD","LONG","SHORT"].includes(value))found.push(value);
  return [...new Set(found)].slice(0,4);
}
async function market(symbol){
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=1y&interval=1d";
  const response=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"}});
  if(!response.ok)throw new Error("行情來源無回應");
  const data=await response.json(), quote=data.chart?.result?.[0];
  if(!quote)throw new Error("找不到行情");
  const closes=quote.indicators.quote[0].close.filter(Number.isFinite);
  if(closes.length<50)throw new Error("歷史資料不足");
  const last=closes.at(-1), month=closes.at(-22), average=n=>closes.slice(-n).reduce((a,b)=>a+b,0)/Math.min(n,closes.length);
  const gains=[],losses=[];
  for(let i=closes.length-14;i<closes.length;i++){const change=closes[i]-closes[i-1];gains.push(Math.max(change,0));losses.push(Math.max(-change,0));}
  const avgGain=gains.reduce((a,b)=>a+b,0)/14,avgLoss=losses.reduce((a,b)=>a+b,0)/14;
  const rsi=avgLoss===0?100:100-100/(1+avgGain/avgLoss);
  return {symbol,date:new Date(quote.timestamp.at(-1)*1000).toISOString().slice(0,10),close:last,oneMonthPct:(last/month-1)*100,ma20:average(20),ma50:average(50),rsi};
}
export default {async fetch(request,env){
  const origin=request.headers.get("Origin")||"";
  if(request.method==="OPTIONS")return origin===env.ALLOWED_ORIGIN?new Response(null,{headers:cors(origin)}):new Response(null,{status:403});
  if(new URL(request.url).pathname!=="/api/chat")return new Response("Not found",{status:404});
  if(origin!==env.ALLOWED_ORIGIN)return json({error:"Origin not allowed"},403,origin);
  if(request.method!=="POST")return json({error:"Method not allowed"},405,origin);
  const ip=request.headers.get("CF-Connecting-IP")||"unknown",now=Date.now(),times=(recent.get(ip)||[]).filter(t=>now-t<60000);
  if(times.length>=8)return json({error:"請稍候一分鐘再試。"},429,origin);
  times.push(now);recent.set(ip,times);
  try{
    if(!env.OPENAI_API_KEY)return json({error:"Worker 尚未設定 OpenAI API 金鑰。"},503,origin);
    const body=await request.json(),messages=(body.messages||[]).filter(m=>["user","assistant"].includes(m.role)&&typeof m.content==="string").slice(-8);
    const latest=[...messages].reverse().find(m=>m.role==="user")?.content||"";
    if(!latest)return json({error:"請輸入問題。"},400,origin);
    const allQuestions=messages.filter(m=>m.role==="user").map(m=>m.content).join(" "),symbols=detectSymbols(allQuestions),quotes=[];
    for(const symbol of symbols){try{quotes.push(await market(symbol));}catch(error){quotes.push({symbol,error:error.message});}}
    const instructions="你是繁體中文投資研究助手。投資期間偏好："+(body.horizon||"尚未設定")+"；風險承受度："+(body.risk||"尚未設定")+"。先使用 web_search 尋找相關近期消息與主要時事，再結合行情資料作答。清楚標明資料日期和來源；區分事實、推論與情境；說明趨勢依據、正反面因素、可考慮的下一步與風險。可以解釋買進、續抱、減碼的條件，但不保證漲跌、不編造價格、不給確定指令。若股票標的無法辨識，先詢問，不要猜測。若使用者沒有提供持倉或期限，說明分析假設。使用繁體中文。不可操作券商或下單。\n\n行情資料（Yahoo Finance 調整後日線，可能延遲）：\n"+JSON.stringify(quotes);
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-6.2-astra",tools:[{type:"web_search",search_context_size:"medium",user_location:{type:"approximate",country:"TW",timezone:"Asia/Taipei"}}],instructions,input:messages})});
    const result=await response.json();
    if(!response.ok)return json({error:result.error?.message||"AI 分析服務暫時失敗。"},502,origin);
    const answer=(result.output||[]).filter(item=>item.type==="message").flatMap(item=>item.content||[]).filter(part=>part.type==="output_text").map(part=>part.text).join("\n");
    return json({answer,quotes},200,origin);
  }catch(error){return json({error:"處理請求時發生錯誤。"},500,origin);}
}};
