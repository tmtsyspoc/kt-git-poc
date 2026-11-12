/************************************************
 * IndexedDB.module.js
 * Created at 2025. 4. 28. 오후 2:55:56.
 *
 * @author HWPS
 ************************************************/

const DB_NAME = "MyDatabase";
const STORE_NAME = "MyStore";
const DB_VERSION = 1;

// 1. 데이터베이스 열기
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "seq",autoIncrement:true});
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}
globals.openDB = openDB;
// 2. 데이터 추가
async function addData(data) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add(data);
  await tx.complete;
  db.close();
}
globals.addData = addData;

async function getData(seq,funcs) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  const getRequest = store.get(seq);

  getRequest.onsuccess = (event) => {
    const data = event.target.result;
    if (data) {
    	funcs(data);
    } else {
      console.error(`SEQ ${seq}를 가진 데이터가 없습니다.`);
    }
  };

  getRequest.onerror = (event) => {
    console.error("데이터 가져오기 실패:", event.target.error);
  };

  await tx.complete;
  db.close();
}
globals.getData = getData;

// 3. 전체 리스트 조회
async function getAllData(funcs) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  request.onsuccess = (event) => {
//    console.log("전체 데이터:", JSON.stringify(event.target.result, null, 2));
    if(funcs){
    	funcs(event.target.result);
    }
//    return event.target.result;
  };

  request.onerror = (event) => {
    console.error("조회 실패:", event.target.error);
  };
}
globals.getAllData = getAllData;
// 4. 특정 SEQ 삭제
async function deleteData(seq) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(seq);
  await tx.complete;
  db.close();
}
globals.deleteData = deleteData;
// 5. 특정 SEQ 데이터 업데이트
async function updateData(seq, updatedFields) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  const getRequest = store.get(seq);

  getRequest.onsuccess = (event) => {
    const data = event.target.result;
    if (data) {
      Object.assign(data, updatedFields); // 변경할 필드만 업데이트
      store.put(data);
    } else {
      console.error(`SEQ ${seq}를 가진 데이터가 없습니다.`);
    }
  };

  getRequest.onerror = (event) => {
    console.error("데이터 가져오기 실패:", event.target.error);
  };

  await tx.complete;
  db.close();
}

globals.updateData = updateData;