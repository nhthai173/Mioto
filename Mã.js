var base_uri = ''

/**
 * Get Cookies from reponse header
 * @param{string|string[]} cookies
 * @returns {string}
 */
function _getCookies(cookies = []) {
  if (!cookies) return ''
  if (typeof cookies == 'string') {
    return cookies.split('; ')[0]
  } else if (cookies.length) {
    return cookies.map(c => c.split('; ')[0]).join('; ')
  }
  return ''
}

/**
 * Login to Mioto
 * @param {string} user email or phone
 * @param {string} password
 */
function login(user, password) {
  let result = { success: false, cookie: '', msg: ''}
  if (!user || !password) {
    result.msg = 'user or password is empty!'
    return result
  }
  const res = UrlFetchApp.fetch(`https://accounts.mioto.vn/mapi/login/pwd?name=${user}&pwd=${password}`, {
    muteHttpExceptions: true,
    method: 'post'
  })
  result.msg = res.getContentText()
  try {
    const json = JSON.parse(result.msg)
    if (json.error == -40212) {
      result.success = true
      result.cookie = _getCookies(res.getAllHeaders()['Set-Cookie'])
    }
  } catch (e) {
    result.msg += '; ' + e
  }
  return result
}


function getTrips(cookie) {
  // response.error: 0,
  // response.errorMessage: "Thành công",
  
  // response.data
  
  // data.trips: []
  // .id
  // .ownerId
  // .travelerId
  // .carId
  // .status
  // .tripDateFrom: 1676383200000
  // .tripDateTo: 1676466000000
  // .timeCanceled // nhận biết hủy // none = 0; yes = timestamp
  // .timeDeposited, // nhận biết cọc
  // .timePickup // nhận biết bắt đầu
  // .timeReturn // nhận biết kết thúc
  // .priceSummary.totalDays: 2
  // .priceSummary.price: 700000
  // .priceSummary.totalAllDay: 1265000 * 0.85
  // .priceSummary.deliveryDistance
  // .priceSummary.deliveryFee
  // .insActiveInfo.certUrl: "https://g2.globalcare.vn/file/25d2dfa5-b685-4bac-9992-6b50458d63d2"
  
  // data.cars: []

  
  // data.profiles[]
  // data.profiles[].uid
  // data.profiles[].name
  // sđt, gplx

  // all
  // https://m-car.mioto.vn/trip/histories?fromId=&pos=0&ver=0

  // active
  // https://m-car.mioto.vn/trip/mytrips?&fromTripId=0&pos=0&ver=0
}

function getTripsByOwner(cookie, ownerId) {

}


function getTripsByTraveler(cookie, travelerId) {

}