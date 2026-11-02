export function demoCacheKey(base:string,identity:string){
 if(!identity||!identity.trim())throw Error('샘플 저장 공간을 열려면 로그인이 필요합니다.');
 return base+':'+identity;
}
