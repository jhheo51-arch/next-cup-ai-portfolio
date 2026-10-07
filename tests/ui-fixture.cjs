// Explicit local UI fixture. In-memory DB, synthetic accounts and AI. Never used by npm start.
const {createApp}=require('../app/server.cjs');
const app=createApp({dbPath:':memory:',aiOverride:{configured:true,model:'test-fixture',taste:async()=>({result:{likes:['cream','ice'],dislikes:['crunch'],essentialRice:'no',understanding:'화면 시험용 응답: 크림감과 갈린 얼음이 좋고 바삭한 토핑은 피합니다.',question:'부드러운 크림감을 더 중요하게 생각하시나요?'},meta:{model:'test-fixture',ms:1}}),summary:async posts=>({result:{groups:[{label:'시험용: 구수한 쌀 풍미',evidence:posts.slice(0,2).map(p=>({id:p.id,quote:p.text.split('\n')[1]}))}],caution:'합성 자료로 UI를 검증하는 시험입니다.'},meta:{model:'test-fixture',ms:1}})}});
const owner=app.store.signup({handle:'ui_tester',password:'Only-For-UI-Testing-4321',invite:app.store.invite('admin')});
const member=app.store.signup({handle:'sample_member',password:'Only-For-UI-Testing-4321',invite:app.store.invite()});
app.store.create(member,'request',{kind:'return',localMenu:'',reason:'[합성 시험 자료] 구수한 쌀 풍미가 그리워요.',keep:'쌀 풍미',change:'단맛은 줄여도 괜찮아요.'});
app.store.create(owner,'idea',{title:'[시험용] 햅쌀 구름',base:'cream',ingredients:['rice','sesame'],texture:'smooth',story:'[합성 시험 자료] 쌀 음료를 좋아하는 사람의 오후 간식.'});
app.server.listen(4321,'127.0.0.1',()=>console.log('UI fixture only: http://127.0.0.1:4321, in-memory data'));
