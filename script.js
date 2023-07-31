(function () {
  const busInfo = {
    busNumber: 5515,
    busId: 100100252,
    typeA: ['2555', '5311', '5314', '5320', '8902', '8915'],
    typeB: ['2503', '2521', '4676', '5321', '8975', '9032', '9077'],
    initStationId: '120000228'
  };

  viewBusStation(busInfo);

  document.addEventListener('DOMContentLoaded', () =>
    document.getElementById('contact').addEventListener('click', () =>
      window.open('https://forms.gle/YU5g2hrFfcZNrSzbA', '_blank')
    ));
})();

function viewBusStation(busInfo) {
  getBusStationData(Date.now(), busInfo)
    .then(busStationData => {
      const busStationInfoList = createBusStationList(busStationData);
      drawBusStationElement(busInfo, busStationInfoList);
      viewBusArrivalInfo(busInfo, busInfo.initStationId);
    })
};

function getBusStationData(currentTimestamp, busInfo) {
  const busStationDataFetchUrl = `https://bus.go.kr/sbus/bus/selectBusposInfo.do?_dc=${currentTimestamp}&routeId=${busInfo.busId}&isLowBus=N`;

  return fetch(busStationDataFetchUrl)
    .then(response => response.json())
    .then(data => data.ResponseVO.data.resultRouteStop)
    .catch(error => console.error('BUS STATION DATA ERROR:', error));
};

function createBusStationList(busStationData) {
  const busStationInfoList = [];
  for (let i = 16; i < 32; i++) {
    const busStationInfoObj = {
      stationId: busStationData[i].station,
      stationName: busStationData[i].stationName
    };
    busStationInfoList.push(busStationInfoObj);
  }
  return busStationInfoList;
};

function drawBusStationElement(busInfo, busStationInfoList) {
  const busInfoParentEl = document.getElementById('main-area');

  busStationInfoList.forEach(busStation => {
    const busInfoEl = document.createElement('div');
    busInfoEl.classList.add('bus-info');

    const busStationIconEl = document.createElement('div');
    busStationIconEl.classList.add('bus-station-icon');
    busInfoEl.appendChild(busStationIconEl);

    const busStationNameEl = document.createElement('h4');
    busStationNameEl.classList.add('bus-station-name');
    busStationNameEl.textContent = busStation.stationName;
    busInfoEl.appendChild(busStationNameEl);

    const busArrivalInfoEl = document.createElement('ul');
    busArrivalInfoEl.setAttribute('id', 'st-' + busStation.stationId);
    busInfoEl.appendChild(busArrivalInfoEl);

    busInfoEl.addEventListener('click', () => {
      resetBusArrivalInfo();
      viewBusArrivalInfo(busInfo, busStation.stationId);
    });

    busInfoParentEl.appendChild(busInfoEl);
  });
};

function viewBusArrivalInfo(busInfo, busStationId) {
  getBusArrivalInfo(Date.now(), busInfo.busId, busStationId)
    .then(busArrivalInfoRawData => {
      const firstArrivalBusInfo = parseBusArrivalInfo(1, busArrivalInfoRawData, busInfo.typeA, busInfo.typeB);
      const secondArrivalBusInfo = parseBusArrivalInfo(2, busArrivalInfoRawData, busInfo.typeA, busInfo.typeB);
      drawBusArrivalInfoElement(busStationId, { firstArrivalBusInfo, secondArrivalBusInfo });
    })
};

function getBusArrivalInfo(currentTimestamp, busId, busStationId) {
  const busArrivalInfoFetchUrl = `https://bus.go.kr/sbus/bus/selectBusArrive.do?_dc=${currentTimestamp}&rtid=${busId}&stnuid=&rttp=&stopId=${busStationId}&stopOrd=&rtnm=`;

  return fetch(busArrivalInfoFetchUrl)
    .then(response => response.json())
    .then(data => data.ResponseVO.data.resultList[0])
    .catch(error => console.error('BUS ARRIVAL INFO ERROR:', error));
};

function parseBusArrivalInfo(arrivalBusOrder, busArrivalInfoRawData, busTypeListA, busTypeListB) {
  if (arrivalBusOrder === 1) busArrivalInfoRawData.congestion1 = busArrivalInfoRawData.congestion;

  let busArrivalInfoResult = {
    runningStatus: busArrivalInfoRawData[`statnm${arrivalBusOrder}`],
    busNumber: '',
    arrivalInfo: [],
    congestion: '',
    busType: ''
  };

  if (busArrivalInfoResult.runningStatus !== '운행종료') {
    busArrivalInfoResult.busNumber = busArrivalInfoRawData[`busnum${arrivalBusOrder}`].slice(-4);
    busArrivalInfoResult.arrivalInfo = busArrivalInfoRawData[`avgs${arrivalBusOrder}`].split(/\[|\]/);
    busArrivalInfoResult.congestion = busArrivalInfoRawData[`congestion${arrivalBusOrder}`];
    busArrivalInfoResult.busType = getBusType(busArrivalInfoResult.busNumber, busTypeListA, busTypeListB);
  }

  function getBusType(busNumber, busTypeListA, busTypeListB) {
    if (busNumber === '8914')
      return 'AB공동운행';
    else if (busTypeListA.includes(busNumber))
      return '5515A';
    else if (busTypeListB.includes(busNumber))
      return '5515B';
    else
      return 'AB정보없음';
  };

  return busArrivalInfoResult;
};

function drawBusArrivalInfoElement(busStationId, busArrivalInfoResult) {
  const busArrivalInfoParentEl = document.getElementById('st-' + busStationId);

  const firstArrivalInfoEl = createBusArrivalInfoElement(1, busArrivalInfoResult.firstArrivalBusInfo);
  const secondArrivalInfoEl = createBusArrivalInfoElement(2, busArrivalInfoResult.secondArrivalBusInfo);

  busArrivalInfoParentEl.appendChild(firstArrivalInfoEl);
  busArrivalInfoParentEl.appendChild(secondArrivalInfoEl);

  busArrivalInfoParentEl.style.display = 'block';
  busArrivalInfoParentEl.style.backgroundColor = '#eee';

  function createBusArrivalInfoElement(arrivalBusOrder, busArrivalInfo) {
    let arrivalInfoContent = '';

    if (busArrivalInfo.runningStatus === '운행종료') arrivalInfoContent = busArrivalInfo.runningStatus;
    else arrivalInfoContent = busArrivalInfo.arrivalInfo[0] + ' (' + (busArrivalInfo.arrivalInfo[1] ? busArrivalInfo.arrivalInfo[1] + ', ' : '') + busArrivalInfo.congestion + ') - ' + busArrivalInfo.busType;

    const arrivalInfoListEl = document.createElement('li');
    const arrivalInfoContentEl = document.createElement('span');
    arrivalInfoContentEl.classList.add('bus-arrival-info' + arrivalBusOrder);
    arrivalInfoContentEl.textContent = arrivalInfoContent;
    arrivalInfoListEl.appendChild(arrivalInfoContentEl);

    return arrivalInfoListEl;
  }
};

function resetBusArrivalInfo() {
  document.querySelectorAll('ul').forEach(arrivalInfo => {
    arrivalInfo.style.display = 'none';
    arrivalInfo.innerHTML = '';
  });
};