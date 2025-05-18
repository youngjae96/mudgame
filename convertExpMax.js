const fs = require('fs');
const CUTOFF_DATE = new Date('2025-05-16T00:00:00Z');

// 누적 경험치로 힘을 역산하는 함수
function calcStatFromCumulativeExp(cumExp, ratio) {
  let max = 10;
  let stat = 5;
  let total = 0;
  while (total + Math.floor(max * ratio + 5) <= cumExp) {
    max = Math.floor(max * ratio + 5);
    total += max;
    stat++;
    if (stat > 999) break; // 무한루프 방지
  }
  return stat;
}

// 힘 → 경험치 최대치 변환 함수
function calcStatExpMax(stat, ratio) {
  let max = 10;
  for (let i = 5; i < (stat || 5); i++) {
    max = Math.floor(max * ratio + 5);
  }
  return max;
}

// 5에서 현재 스탯까지 올리는 데 필요한 누적 경험치 계산
function calcCumulativeExp(stat, ratio) {
  let max = 10;
  let total = 0;
  for (let i = 5; i < (stat || 5); i++) {
    max = Math.floor(max * ratio + 5);
    total += max;
  }
  return total;
}

function main() {
  const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  const userCreatedAtMap = {};
  users.forEach(u => {
    const id = (u._id && u._id.$oid) ? u._id.$oid : (typeof u._id === 'string' ? u._id : String(u._id));
    let createdAt = u.createdAt;
    if (createdAt && createdAt.$date) createdAt = createdAt.$date;
    userCreatedAtMap[id] = createdAt;
  });

  const data = JSON.parse(fs.readFileSync('playerdatas.json', 'utf8'));

  for (const user of data) {
    const userId = user.userId && user.userId.$oid ? user.userId.$oid : (typeof user.userId === 'string' ? user.userId : String(user.userId));
    const createdAt = userId ? new Date(userCreatedAtMap[userId]) : null;
    let ratio = 1.16;
    let cumRatio = 1.16;
    if (createdAt && createdAt < CUTOFF_DATE) cumRatio = 1.2;

    // 디버깅 로그
    console.log(`name: ${user.name}, userId: ${userId}, createdAt: ${createdAt}, cumRatio: ${cumRatio}`);

    // 누적 경험치는 cumRatio, 역산은 1.16로 고정
    let strCumExp = calcCumulativeExp(user.str, cumRatio) + (user.strExp || 0);
    let dexCumExp = calcCumulativeExp(user.dex, cumRatio) + (user.dexExp || 0);
    let intCumExp = calcCumulativeExp(user.int, cumRatio) + (user.intExp || 0);

    let newStr = calcStatFromCumulativeExp(strCumExp, 1.16);
    let newDex = calcStatFromCumulativeExp(dexCumExp, 1.16);
    let newInt = calcStatFromCumulativeExp(intCumExp, 1.16);

    if (newStr > (user.str || 5)) user.str = newStr;
    if (newDex > (user.dex || 5)) user.dex = newDex;
    if (newInt > (user.int || 5)) user.int = newInt;

    user.strExpMax = calcStatExpMax(user.str, 1.16);
    user.dexExpMax = calcStatExpMax(user.dex, 1.16);
    user.intExpMax = calcStatExpMax(user.int, 1.16);
  }

  fs.writeFileSync('playerdatas_new.json', JSON.stringify(data, null, 2));
  console.log('변환 완료! playerdatas_new.json 파일을 Import 하세요.');
}

main(); 