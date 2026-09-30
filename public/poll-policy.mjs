export function nextPollTime(now,nextAttempt,failures=0){
  const sourceDelay=Date.parse(nextAttempt??'');
  const backoff=Math.min(300000,30000*2**Math.min(failures,4));
  return Math.max(now+backoff,Number.isFinite(sourceDelay)?sourceDelay:0);
}
export function canPoll({enabled,hidden,mode,busy,now,due}){
  return enabled&&!hidden&&mode==='live'&&!busy&&now>=due;
}
