import {spawnSync} from 'node:child_process';
// Next route analysis must never open or mutate the running company's database.
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,AI_UNIVERSE_DB:':memory:'}});
process.exitCode=result.status??1;
