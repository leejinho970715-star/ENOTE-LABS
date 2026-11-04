import {seed} from '../src/agents/registry';
import {liveReadiness} from '../src/lib/readiness';
seed();const r=liveReadiness();console.log(JSON.stringify({liveReady:r.ready,missing:r.missing,agentsMissingModel:r.missingModels,worker:r.worker,verification:'구성 확인일 뿐 실제 모델/검색 성공 검증이 아닙니다.'},null,2));
