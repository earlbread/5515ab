(function () {
  const busInfo = {
    busNumber: 5515,
    busId: 100100252,
    typeA: ['2501', '2555', '5311', '5314', '5320', '8902', '8915'],
    typeB: ['2503', '2521', '4676', '5321', '8975', '9032', '9077'],
    initStationId: '120000228'
  };

  viewStation(busInfo);

  document.addEventListener('DOMContentLoaded', () =>
    document.getElementById('contact').addEventListener('click', () =>
      window.open('https://forms.gle/YU5g2hrFfcZNrSzbA', '_blank')
    ));
})();

function viewStation(busInfo) {
  getStationData(Date.now(), busInfo.busId)
    .then(stationData => {
      const stationInfoList = createStationList(stationData);
      drawStationElement(busInfo, stationInfoList);
      viewArrivalInfo(busInfo, busInfo.initStationId);
    })
};

function getStationData(currentTimestamp, busId) {
  const stationDataFetchUrl = `https://bus.go.kr/sbus/bus/selectBusposInfo.do?_dc=${currentTimestamp}&routeId=${busId}&isLowBus=N`;

  return fetch(stationDataFetchUrl)
    .then(response => response.json())
    .then(data => data.ResponseVO.data.resultRouteStop)
    .catch(error => console.error('BUS STATION DATA ERROR:', error));
};

function createStationList(stationData) {
  const END_INDEX = stationData.length;
  const START_INDEX = END_INDEX / 2;

  return stationData.slice(START_INDEX, END_INDEX).map(stationData => ({
    stationId: stationData.station,
    stationName: stationData.stationName
  }));
};

function drawStationElement(busInfo, stationInfoList) {
  const busInfoParentEl = document.getElementById('main-area');

  stationInfoList.forEach(station => {
    const busInfoEl = document.createElement('div');
    busInfoEl.classList.add('bus-info');

    const arrivalInfoEl = document.createElement('ul');
    arrivalInfoEl.setAttribute('id', 'st-' + station.stationId);
    busInfoEl.appendChild(arrivalInfoEl);

    const stationIconEl = document.createElement('div');
    stationIconEl.classList.add('bus-station-icon');
    busInfoEl.appendChild(stationIconEl);

    const stationNameEl = document.createElement('h4');
    stationNameEl.classList.add('bus-station-name');
    stationNameEl.textContent = station.stationName;
    busInfoEl.appendChild(stationNameEl);

    busInfoEl.addEventListener('click', () => {
      resetArrivalInfo();
      viewArrivalInfo(busInfo, station.stationId);
    });

    busInfoParentEl.appendChild(busInfoEl);
  });
};

function viewArrivalInfo(busInfo, stationId) {
  getArrivalInfo(Date.now(), busInfo.busId, stationId)
    .then(arrivalInfoRaw => {
      const firstArrivalInfo = parseArrivalInfo(1, arrivalInfoRaw, busInfo.typeA, busInfo.typeB);
      const secondArrivalInfo = parseArrivalInfo(2, arrivalInfoRaw, busInfo.typeA, busInfo.typeB);
      drawArrivalInfoElement(stationId, { firstArrivalInfo, secondArrivalInfo });
    })
};

function getArrivalInfo(currentTimestamp, busId, stationId) {
  const arrivalInfoFetchUrl = `https://bus.go.kr/sbus/bus/selectBusArrive.do?_dc=${currentTimestamp}&rtid=${busId}&stnuid=&rttp=&stopId=${stationId}&stopOrd=&rtnm=`;

  return fetch(arrivalInfoFetchUrl)
    .then(response => response.json())
    .then(data => data.ResponseVO.data.resultList[0])
    .catch(error => console.error('BUS ARRIVAL INFO ERROR:', error));
};

function parseArrivalInfo(arrivalOrder, arrivalInfoRaw, busTypeListA, busTypeListB) {
  if (arrivalOrder === 1) arrivalInfoRaw.congestion1 = arrivalInfoRaw.congestion;

  let arrivalInfoResult = {
    runningStatus: arrivalInfoRaw[`statnm${arrivalOrder}`],
    busNumber: '',
    arrivalInfo: [],
    congestion: '',
    busType: ''
  };

  if (isRunningBus(arrivalInfoResult.runningStatus)) {
    arrivalInfoResult.busNumber = arrivalInfoRaw[`busnum${arrivalOrder}`].slice(-4);
    arrivalInfoResult.arrivalInfo = extractArrivalInfo(arrivalInfoRaw[`avgs${arrivalOrder}`]);
    arrivalInfoResult.congestion = arrivalInfoRaw[`congestion${arrivalOrder}`];
    arrivalInfoResult.busType = getBusType(arrivalInfoResult.busNumber, busTypeListA, busTypeListB);
  }

  return arrivalInfoResult;
};

function isRunningBus(runningStatus) {
  return runningStatus === '일반운행' || runningStatus === '막차운행' || runningStatus === '첫차운행';
}

function extractArrivalInfo(arrivalInfoRawString) {
  return arrivalInfoRawString
    .split(/\[|\]/)
    .map(str => str.trim())
    .filter(str => str && str !== '막차');
};

function getBusType(busNumber, busTypeListA, busTypeListB) {
  if (busNumber === '8914') return 'AB변동버스';
  if (busTypeListA.includes(busNumber)) return '5515A';
  if (busTypeListB.includes(busNumber)) return '5515B';
  return 'AB정보없음';
};

function drawArrivalInfoElement(stationId, { firstArrivalInfo, secondArrivalInfo }) {
  const arrivalInfoParentEl = document.getElementById('st-' + stationId);

  const firstArrivalInfoEl = createArrivalInfoElement(1, firstArrivalInfo);
  const secondArrivalInfoEl = createArrivalInfoElement(2, secondArrivalInfo);

  arrivalInfoParentEl.appendChild(secondArrivalInfoEl);
  arrivalInfoParentEl.appendChild(firstArrivalInfoEl);

  arrivalInfoParentEl.style.display = 'block';
};

function createArrivalInfoElement(arrivalOrder, busArrivalInfo) {
  const { runningStatus, arrivalInfo, congestion, busType } = busArrivalInfo;
  const [arrivalTime, beforeStation] = arrivalInfo;
  const lastBus = runningStatus === '막차운행' ? '(막차)' : '';
  let arrivalInfoContent = '';

  if (!isRunningBus(runningStatus)) arrivalInfoContent = runningStatus;
  else if (beforeStation) arrivalInfoContent = `${arrivalTime} (${beforeStation}, ${congestion}) - ${busType}${lastBus}`;
  else arrivalInfoContent = `${arrivalTime} (${congestion}) - ${busType}${lastBus}`;

  const arrivalInfoListEl = document.createElement('li');
  const arrivalInfoContentEl = document.createElement('span');
  arrivalInfoContentEl.classList.add(`bus-arrival-info${arrivalOrder}`);
  arrivalInfoContentEl.textContent = arrivalInfoContent;
  arrivalInfoListEl.appendChild(arrivalInfoContentEl);

  return arrivalInfoListEl;
};

function resetArrivalInfo() {
  document.querySelectorAll('ul').forEach(arrivalInfo => {
    arrivalInfo.innerHTML = '';
    arrivalInfo.style.display = 'none';
  });
};