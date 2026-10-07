const fs=require('node:fs'),path=require('node:path'),{openStore}=require('./db.cjs');
fs.mkdirSync(path.join(__dirname,'../runtime'),{recursive:true});
const store=openStore(path.join(__dirname,'../runtime/next-cup.sqlite'));
const action=process.argv[2];
try {
 if(action==='owner-setup') {
  const destination=path.join(__dirname,'../runtime/owner-invite.txt');
  if(fs.existsSync(destination))console.log('기존 운영자 초대 파일을 보존했습니다.');
  else {const code=store.invite('admin');fs.writeFileSync(destination,'NEXT CUP 로컬 시험 서비스 운영자 초대\n7일 이내 한 번만 사용하세요. 다른 사람에게 공유하지 마세요.\n\n'+code+'\n\nhttp://127.0.0.1:4322/#community 에서 직접 아이디와 새 비밀번호를 정해 가입하세요.\n',{flag:'wx'});console.log('운영자 초대 파일을 준비했습니다. 코드, 비밀번호를 로그에 출력하지 않았습니다.');}
 } else if(['invite','admin-invite'].includes(action)) {
  console.log('7일 이내 1회만 사용할 초대 코드입니다. 초대할 사람에게만 전달하세요.');console.log(store.invite(action==='admin-invite'?'admin':'member'));
 } else if(action==='reports')console.log(JSON.stringify(store.operations(),null,2));
 else console.log('사용법: npm run invite / npm run admin-invite / npm run reports');
} finally {store.close();}
