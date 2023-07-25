(function () {
  const busInfo = {
    busNumber: 5515,
    busId: 100100252,
    typeA: ['2555', '5311', '5314', '5320', '8902', '8915'],
    typeB: ['2503', '2521', '4676', '5321', '8914', '8975', '9032', '9077'],
    initStationId: '120000228'
  };
  viewBusStation(busInfo);
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
    .then(busArrivalInfo => {
      const busArrivalInfoObj = parseBusArrivalInfo(busArrivalInfo, busInfo);
      drawBusArrivalInfoElement(busStationId, busArrivalInfoObj);
    })
};

function getBusArrivalInfo(currentTimestamp, busId, busStationId) {
  const busArrivalInfoFetchUrl = `https://bus.go.kr/sbus/bus/selectBusArrive.do?_dc=${currentTimestamp}&rtid=${busId}&stnuid=&rttp=&stopId=${busStationId}&stopOrd=&rtnm=`;

  return fetch(busArrivalInfoFetchUrl)
    .then(response => response.json())
    .then(data => data.ResponseVO.data.resultList[0])
    .catch(error => console.error('BUS ARRIVAL INFO ERROR:', error));
};

function parseBusArrivalInfo(busArrivalInfo, busInfo) {
  const busArrivalInfoObj = {
    firstBusNumber: busArrivalInfo.busnum1.slice(-4),
    secondBusNumber: busArrivalInfo.busnum2.slice(-4),
    firstArrivalInfo: busArrivalInfo.avgs1.split(/\[|\]/),
    secondArrivalInfo: busArrivalInfo.avgs2.split(/\[|\]/),
    firstBusCongestion: busArrivalInfo.congestion,
    secondBusCongestion: busArrivalInfo.congestion2
  };
  busArrivalInfoObj.firstBusType = getBusType(busArrivalInfoObj.firstBusNumber);
  busArrivalInfoObj.secondBusType = getBusType(busArrivalInfoObj.secondBusNumber);

  function getBusType(busNumber) {
    let busType = '';
    if (busInfo.typeA.find(number => number === busNumber))
      busType = '5515A';
    else if (busInfo.typeB.find(number => number === busNumber))
      busType = '5515B';
    else
      busType = 'AB 정보없음';
    return busType;
  };

  return busArrivalInfoObj;
};

function drawBusArrivalInfoElement(busStationId, O) {
  const busArrivalInfoParentEl = document.getElementById('st-' + busStationId);

  const firstArrivalInfContent = O.firstArrivalInfo[0] + ' (' + (O.firstArrivalInfo[1] ? O.firstArrivalInfo[1] + ', ' : '') + O.firstBusCongestion + ') - ' + O.firstBusType;
  const secondArrivalInfContent = O.secondArrivalInfo[0] + ' (' + (O.secondArrivalInfo[1] ? O.secondArrivalInfo[1] + ', ' : '') + O.secondBusCongestion + ') - ' + O.secondBusType;

  const firstArrivalInfoListEl = document.createElement('li');
  const firstArrivalInfoContentEl = document.createElement('span');
  firstArrivalInfoContentEl.classList.add('bus-arrival-info1');
  firstArrivalInfoContentEl.textContent = firstArrivalInfContent;
  firstArrivalInfoListEl.appendChild(firstArrivalInfoContentEl);

  const secondArrivalInfoListEl = document.createElement('li');
  const secondArrivalInfoContentEl = document.createElement('span');
  secondArrivalInfoContentEl.classList.add('bus-arrival-info2');
  secondArrivalInfoContentEl.textContent = secondArrivalInfContent;
  secondArrivalInfoListEl.appendChild(secondArrivalInfoContentEl);

  busArrivalInfoParentEl.appendChild(firstArrivalInfoListEl);
  busArrivalInfoParentEl.appendChild(secondArrivalInfoListEl);

  busArrivalInfoParentEl.style.display = 'block';
  busArrivalInfoParentEl.style.backgroundColor = '#eee';
};

function resetBusArrivalInfo() {
  document.querySelectorAll('ul').forEach(arrivalInfo => {
    arrivalInfo.style.display = 'none';
    arrivalInfo.innerHTML = '';
  });
};