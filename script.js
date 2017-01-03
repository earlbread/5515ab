const numInfo = {
  '5515A': ['2555', '5311', '5314', '5320', '5320', '8902', '8915'],
  '5515B': ['2503', '2521', '4676', '5321', '8975', '9032', '9077']
}

const findNumInfo = busNum => Object.keys(numInfo).find(key => numInfo[key].includes(busNum)) || '5515AB 정보없음';

const updateBusInfo = (busElement, avgs, busNum) => {
  if (avgs) {
    const parsedBusNum = busNum.slice(-4);
    busElement.innerHTML = `${avgs} (${parsedBusNum} - ${findNumInfo(parsedBusNum)})`;
  } else {
    busElement.innerHTML = '운행종료';
  }
};

window.onload = async () => {

  const bus1 = document.getElementById("bus1");
  const bus2 = document.getElementById("bus2");

  const currentTimestamp = Date.now();
  const rtid = '100100252';
  const stopId = '120000228';

  const url = `https://bus.go.kr/sbus/bus/selectBusArrive.do?_dc=${currentTimestamp}&rtid=${rtid}&stnuid=&rttp=&stopId=${stopId}&stopOrd=&rtnm=`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const resultData = data['ResponseVO']['data']['resultList'][0];

    updateBusInfo(bus1, resultData['avgs1'], resultData['busnum1']);
    updateBusInfo(bus2, resultData['avgs2'], resultData['busnum2']);
  } catch (error) {
    console.error('Error:', error);
  }
}
