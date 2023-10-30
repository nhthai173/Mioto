function tripParse(tripDetail) {
    function ts2iso(ts) {
        return new Date(ts).toISOString()
    }
    
    function getUserNameById(profiles, id) {
        const user = profiles.find(p => p.uid === id)
        return user ? user.name : ''
    }

    const ex_data = {}

    /* Thông tin chung của chuyến đi */
    if (!tripDetail || !tripDetail.data || !tripDetail.data.trip) return null
    const trip = tripDetail.data.trip
    const car = tripDetail.data.car
    const profiles = tripDetail.data.profiles

    ex_data.id = trip.id
    ex_data.time = { start: ts2iso(trip.tripDateFrom), end: ts2iso(trip.tripDateTo) }
    ex_data.time_text = `${ex_data.time.start} - ${ex_data.time.end}`

    /* Review chuyển đi */
    ex_data.review = {traveler: {}, owner: {}}
    if (trip.reviewFromTraveller) {
        ex_data.review.traveler = {
            rating: trip.reviewFromTraveller.rating,
            comment: trip.reviewFromTraveller.comment,
        }
    }
    if (trip.reviewFromOwner) {
        ex_data.review.owner = {
            rating: trip.reviewFromOwner.rating,
            comment: trip.reviewFromOwner.comment,
        }
    }

    /* Giao xe */
    ex_data.pickup_location = ''
    const dLocation = trip.dLoc
    if (dLocation && dLocation.lat && dLocation.lon) {
        ex_data.pickup_location = `http://www.google.com/maps/place/${dLocation.lat},${dLocation.lon}`
    }

    /* Tiền */
    const price = trip.priceSummary
    ex_data.price = {
        total: price.priceTotal,
        deposit: price.deposit,
        profit: price.priceTotal - Math.floor(price.deposit * 0.5),
    }

    /* Bảo hiểm */
    ex_data.insurance = ''
    if (trip.insActiveInfo) {
        ex_data.insurance = trip.insActiveInfo.certUrl
    }

    /* Thông tin người cho thuê */
    ex_data.owner = {
        id: trip.ownerId,
        name: getUserNameById(profiles, trip.ownerId),
        phone: trip.ownerPhoneNumber || '',
    }

    /* Thông tin xe */
    ex_data.car = {
        name: car.name,
        plate: car.licensePlate
    }

    /* Thông tin người thuê */
    ex_data.traveller = {
        id: trip.travelerId,
        name: getUserNameById(profiles, trip.travelerId),
        phone: trip.travelerPhoneNumber || '',
        message: trip.messageFromTraveller || '',
    }

    // GPLX
    const driver_license = trip.travellerDriverLicense
    if (driver_license && driver_license.papers && driver_license.papers.length) {
        const { licenseName, licenseNumber, licenseClass, dob, expired } = driver_license
        ex_data.traveller.license = {
            name: licenseName,
            number: licenseNumber,
            class: licenseClass,
            dob: ts2iso(dob),
            expired: ts2iso(expired)
        }
        ex_data.traveller.license.photos = []
        driver_license.papers.forEach(p => {
            if (p.photos && p.photos.length) {
                ex_data.traveller.license.photos.push(...p.photos.map(photo => photo.url))
            }
        });
    } else {
        ex_data.traveller.license = {
            name: '',
            number: '',
            class: '',
            dob: '',
            expired: '',
        }
    }
    
    return ex_data
}



const fs = require('fs')
let trip = fs.readFileSync('./thunder-responses/Trip-fully-detial.json', 'utf-8')
trip = JSON.parse(trip)

console.log(JSON.stringify(tripParse(trip)))