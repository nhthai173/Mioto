var base_uri = ''


/**
 * 
 */
function _sendReq({ url = '', method = 'get', cookie = '', query = {}, json = {}, fullResponse = false } = {}) {
  let headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
  }
  let payload = undefined
  const result = {
    success: false,
    headers: {},
    msg: '',
    data: null
  }
  const _return = () => {
    if (!result.success) {
      console.error(`[Fail][${url}]`)
      if (result.msg)
        console.error('==>', result.msg)
      if (result.data)
        console.error('==>', result.data)
      if (!fullResponse)
        return null
      return result
    }
    if (!fullResponse)
      return result.data
    return result
  }

  if (!url) {
    result.msg = 'Missing URL'
    return _return()
  }
  if (query) {
    let queries = []
    for (const key in query)
      queries.push(encodeURIComponent(key) + '=' + encodeURIComponent(query[key]))
    if (queries.length)
      url += '?' + queries.join('&').substring(-1)
  }
  if (Object.keys(json).length) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(json)
  }
  if (cookie) {
    headers['Cookie'] = cookie
  }

  const req = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    method,
    headers,
    payload
  })
  result.headers = req.getAllHeaders()
  try {
    let jres = JSON.parse(req.getContentText())
    result.msg = jres.errorMessage
    result.data = jres.data
    result.success = true
    console.log(jres)
  } catch (e) {
    result.msg = req.getContentText()
  }
  return _return()
}


/**
 * Get Cookies from reponse header
 * @param{string|string[]} cookies
 * @returns {string}
 */
function _getCookies(cookies = []) {
  if (!cookies) return ''
  if (typeof cookies == 'string') {
    if (cookies.includes('; '))
      return cookies.split('; ')[0]
    if (cookies.includes(';'))
      return cookies.split(';')[0]
    return cookies
  } else if (cookies.length) {
    return cookies.map(c => _getCookies(c)).join('; ')
  }
  return ''
}




/* ================ Login Functions ================ */


/**
 * Login to Mioto
 * @param {string} user email or phone
 * @param {string} password
 * @returns {string} Cookie
 */
function login(user, password) {
  let result = { success: false, cookie: '', msg: '' }
  if (!user || !password) {
    result.msg = 'user or password is empty!'
    return result
  }
  const res = _sendReq({
    fullResponse: true,
    url: 'https://accounts.mioto.vn/mapi/login/pwd',
    method: 'post',
    query: {
      name: user,
      pwd: password
    }
  })
  console.log(res)
  if (!res.success) return ''

  // Steps:
  // - Get Phone number - login()
  // - Request OTP - reqOTP() - Receive a verifyToken
  // - VerifyOTP - verifyOTP() with phone and verifyToken - Receive actionToken
  // - Do Action - doAction() - To get hash and cookie

  if (res.data.phoneNumber) {

  } else {
    return _getCookies(res.headers['Set-Cookie'])
  }
  return ''
}


/**
 * Request OTP code
 * @param {string} phone Phone number
 * @returns {string} Verify token
 */
function reqOTP(phone = '') {
  if (!phone) {
    console.error('[Get OTP Error] Missing Phone number')
    return ''
  }
  const otpRes = _sendReq({
    fullResponse: true,
    url: 'https://accounts.mioto.vn/mapi/phone/otp/gen',
    method: 'post',
    query: {
      phone,
      action: '4',
      otpBy: '0'
    }
  })
  if (!otpRes.success) return ''
  return otpRes.data.verifyToken
}


function verifyOTP(phone = '', verifyToken = '', otp = '') {
  if (!phone || !verifyToken || !otp) {
    console.error('[Verify OTP Error] Missing Phone|VerifyToken|OTP')
    return ''
  }
  const res = _sendReq({
    fullResponse: true,
    url: 'https://accounts.mioto.vn/mapi/phone/otp/verify',
    method: 'post',
    query: {
      phone,
      action: '4',
      verifyToken,
      otp,
      otpBy: '1'
    }
  })
  if (!res.data) return ''
  return res.data.actionToken
}


function doAction(phone = '', verifyToken = '', actionToken = '', otp = '', password = '') {
  if (!phone || !verifyToken || !actionToken || !otp || !password) {
    console.error('[Do-Action Error]')
    return ''
  }
  const res = _sendReq({
    fullResponse: true,
    url: 'https://accounts.mioto.vn/mapi/phone/otp/do-action',
    method: 'post',
    query: {
      phone,
      action: '4',
      method: '2',
      verifyToken,
      actionToken,
      otp,
      pwd: password
    }
  })
  if (!res.data) return ''
  return res
}



/* ================ END Login Functions ================ */


/**
 * Get owner cars
 * @param {string} cookie
 * @param {number} pos
 * @returns {[]{}}
 */
function getCars(cookie, pos = 0) {
  const res = _sendReq({
    url: 'https://m-car.mioto.vn/owner/cars',
    cookie,
    query: {
      filterStatus: 0,
      pos,
      ver: 0,
      all: true
    }
  })
  return res.cars
}


/**
 * Get Car additional Price
 * @param {string} cookie
 * @param {string} carId
 * @returns {{}}
 */
function getCarAdditionalPrice(cookie, carId) {
  const list = {}
  const res = _sendReq({
    url: 'https://m-car.mioto.vn/car/detail',
    cookie,
    query: { carId }
  })
  if (!res || !res.car || !res.car.additionalPrice) return list
  for (const key in res.car.additionalPrice) {
    if (key.includes('Enable') && res.car.additionalPrice[key]) {
      const rkey = key.replace('Enable', '')
      list[rkey] = res.car.additionalPrice[rkey]
    }
  }
  if (res.car.limitEnable) {
    list.limitKM = res.car.limitKM
    list.limitKMPrice = res.car.limitPrice
  }
  return list
}


/**
 * Get all trips
 * @param {string} cookie
 * @param {number} fromId id index
 * @returns {[]{}}
 */
function getTrips(cookie, fromId = 0) {
  let trips = []
  let cars = []
  let profiles = []
  let res = {}

  do {
    res = _sendReq({
      url: 'https://m-car.mioto.vn/trip/histories',
      cookie,
      query: {
        fromId,
        pos: 0,
        ver: 0
      }
    })
    trips = [...trips, ...res.trips]
    cars = [...cars, ...res.cars]
    profiles = [...profiles, ...res.profiles]
    fromId = res.lastId || fromId
  }
  while (res.more)
  
  return trips
    .map(t => parseTrips(t, cars, profiles))
    .filter(t => t)
  
  // return {
  //   trips,
  //   cars,
  //   profiles
  // }
}



function parseTrips(trip, cars = [], profiles = []) {
  function ts2string(ts) {
    return Utilities.formatDate(new Date(ts), 'GMT+7', 'dd/MM/yyyy HH:mm:ss')
  }
  function ts2ddmmyyyy(ts) {
    const d = new Date(ts)
    return Utilities.formatDate(d, 'GMT+7', 'dd/MM/yyyy')
  }
  function getUserInfo(id) {
    if (!id) return {}
    const profile = profiles.find(p => p.uid == id)
    if (!profile || !profile.uid) return {}
    return {
      id: profile.uid,
      name: profile.name || profile.googleName || '',
      avatar: (profile.avatar.fullUrl.match('n1-cstg.mioto.vn/m/avatars/avatar-')) ? '' : (profile.avatar.fullUrl || '')
    }
  }
  function getCarInfo(id) {
    if (!id) return {}
    const car = cars.find(c => c.id == id)
    if (!car || !car.id) return {}
    return {
      id: car.id,
      name: car.name,
      url: `https://www.mioto.vn/car/${car.name.replace(/\s/g, '-')}/${car.id}`,
      owner: getUserInfo(car.ownerId)
    }
  }

  const ex_data = {}
  if (!trip || !Object.keys(trip).length) return null
  switch(trip.status) { case 20: case 23: case 24: return null }
  let owner = getUserInfo(trip.ownerId)
  let traveler = getUserInfo(trip.travelerId)
  let car = getCarInfo(trip.carId)

  /* Info */
  owner.phone = trip.ownerPhoneNumber || ''
  traveler.phone = trip.travelerPhoneNumber || ''
  traveler.message = trip.messageFromTraveller || ''

  /* Thông tin chung của chuyến đi */
  ex_data.id = trip.id
  ex_data.car = car
  ex_data.owner = owner
  ex_data.traveler = traveler
  ex_data.time = {
    start: ts2string(trip.tripDateFrom),
    end: ts2string(trip.tripDateTo),
    pickup: ts2string(trip.timePickup),
    'return': ts2string(trip.timeReturn),
    lastUpdate: ts2string(trip.timeLastAction),
    _timestamp: {
      start: trip.tripDateFrom,
      end: trip.tripDateTo,
      pickup: trip.timePickup,
    'return': trip.timeReturn,
    lastUpdate: trip.timeLastAction,
    }
  }

  /* Review chuyển đi */
  // trip.needReview = 1
  ex_data.review = { traveler: {}, owner: {} }
  if (trip.reviewFromTraveler) {
    ex_data.review.traveler = {
      rating: trip.reviewFromTraveler.rating,
      comment: trip.reviewFromTraveler.comment,
    }
  }
  if (trip.reviewFromOwner) {
    ex_data.review.owner = {
      rating: trip.reviewFromOwner.rating,
      comment: trip.reviewFromOwner.comment,
    }
  }

  /* Giao xe */
  // Hết work
  // ex_data.pickup_location = ''
  // const dLocation = trip.dLoc
  // if (dLocation && dLocation.lat && dLocation.lon) {
  //   ex_data.pickup_location = `http://www.google.com/maps/place/${dLocation.lat},${dLocation.lon}`
  // }

  /* Tiền */
  const price = trip.priceSummary
  ex_data.price = {
    priceOrigin: price.priceOrigin,
    total_traveller: price.priceTotal,
    delivery: price.deliveryFee,
    deposit: price.deposit,
    pickup_receive: price.priceTotal - price.deposit,
    profit: ((price.priceOrigin * price.totalDays) + price.deliveryFee) * 0.85,
  }

  /* Bảo hiểm */
  ex_data.insurance = ''
  if (trip.insActiveInfo) {
    ex_data.insurance = trip.insActiveInfo.certUrl
  }

  // GPLX
  const driver_license = trip.travellerDriverLicense
  if (driver_license && driver_license.papers && driver_license.papers.length) {
    const { licenseName, licenseNumber, licenseClass, dob, expired } = driver_license
    ex_data.traveler.license = {
      name: licenseName,
      number: licenseNumber,
      class: licenseClass,
      dob: ts2ddmmyyyy(dob),
      expired: ts2ddmmyyyy(expired)
    }
    ex_data.traveler.license.photos = []
    driver_license.papers.forEach(p => {
      if (p.photos && p.photos.length) {
        ex_data.traveler.license.photos.push(...p.photos.map(photo => photo.url))
      }
    });
  } else {
    ex_data.traveler.license = {
      name: '',
      number: '',
      'class': '',
      dob: '',
      expired: '',
    }
  }

  return ex_data
}



// function testtesttest() {
  // console.log(parseTrips(trip_reviewed))
  // console.log(login(ACCOUNT.uname, ACCOUNT.pw))

  // const all = getTrips(ACCOUNT.cookie)
  // const { trips, cars, profiles } = all
  // trips.forEach(t => {
  //   const detail = parseTrips(t, cars, profiles)
  //   console.log(JSON.stringify(detail, true, 2))
  // })

  // console.log(getTrips(ACCOUNT.cookie))
// }