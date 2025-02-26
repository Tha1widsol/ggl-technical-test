const getCoordsFromPage = () => {
    let scriptData = document.getElementById("__NEXT_DATA__")?.textContent
    if (!scriptData) return
    let jsonData = JSON.parse(scriptData)

    function findLocation(obj) {
        if (obj && typeof obj === "object") {
            if (obj.location) return obj.location  
            for (let key in obj) {
                let result = findLocation(obj[key])
                if (result) return result
            }
        }
        return
    }

    let locationData = findLocation(jsonData)
    return locationData.latitudeLongitude
}   
const renderWeatherView = (data) => {
    const targetElement = document.querySelector("div[data-testid='place-summary-links']")
    if (!targetElement) {
        console.error("Target element not found")
        return
    }

    const title = document.createElement("h2")
    title.textContent = "Weather Forecast"
    title.style.marginBottom = "10px"

    const weatherContainer = document.createElement("div")
    weatherContainer.classList.add("weather-container")
    weatherContainer.style.maxHeight = "300px"
    weatherContainer.style.overflowY = "auto"
    weatherContainer.style.padding = "10px"
    weatherContainer.style.border = "1px solid #ccc"
    weatherContainer.style.borderRadius = "8px"
    weatherContainer.style.backgroundColor = "#f9f9f9"

    if (!data || !Array.isArray(data.list)) {
        console.error("Invalid or missing weather data")
        return
    }

    const today = new Date().toISOString().split("T")[0] 
    const todayForecasts = data.list.filter(forecast => forecast.dt_txt.startsWith(today)) 

    if (todayForecasts.length > 0) {
        const todayCard = document.createElement("div")
        todayCard.classList.add("today-weather-card")
        todayCard.style.padding = "15px"
        todayCard.style.marginBottom = "15px"
        todayCard.style.border = "1px solid #ccc"
        todayCard.style.borderRadius = "8px"
        todayCard.style.backgroundColor = "#ffefc1" 
        todayCard.style.textAlign = "center"
        todayCard.style.fontSize = "16px"
        todayCard.style.fontWeight = "bold"


        const todayHeader = document.createElement("h3")
        todayHeader.textContent = "Today's Weather"
        todayHeader.style.marginBottom = "10px"

        todayCard.appendChild(todayHeader)

        todayForecasts.forEach(forecast => {
            const { main, weather, dt_txt: time } = forecast
            const temperature = main?.temp?.toFixed(1) ?? "N/A"
            const weatherDescription = weather?.[0]?.description ?? "No description"
            const humidity = main?.humidity ?? "N/A"

            todayCard.innerHTML += `
                <div style="margin-bottom: 10px; padding: 5px; border: 1px solid #ddd ;border-radius: 5px; background-color: #fff">
                    <h4><strong>${new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></h4>
                    <p>🌡️ Temp: ${temperature}°C</p>
                    <p>🌤️ Weather: ${weatherDescription}</p>
                    <p>💧 Humidity: ${humidity}%</p>
                </div>
            `
        })

        targetElement.parentNode.insertBefore(todayCard, targetElement)
    }

    const groupedData = new Map()

    data.list.forEach((forecast) => {
        const dateTime = new Date(forecast.dt_txt)
        const dateStr = dateTime.toISOString().split("T")[0] 

        if (!groupedData.has(dateStr)) {
            groupedData.set(dateStr, [])
        }
        groupedData.get(dateStr).push(forecast)
    })

    groupedData.forEach((forecasts, date) => {
        if (date === today) return 

        const formattedDate = new Date(date).toLocaleDateString('en-GB') 
        const dateHeader = document.createElement("h3")
        dateHeader.textContent = formattedDate
        dateHeader.style.marginTop = "15px"
        dateHeader.style.borderBottom = "2px solid #ddd"
        dateHeader.style.paddingBottom = "5px"

        weatherContainer.appendChild(dateHeader)

        forecasts.forEach((forecast) => {
            const { dt_txt: time, main, weather } = forecast
            const temperature = main?.temp?.toFixed(2) ?? "N/A"
            const weatherDescription = weather?.[0]?.description ?? "No description"
            const humidity = main?.humidity ?? "N/A"

            const weatherItem = document.createElement("div")
            weatherItem.classList.add("weather-item")
            weatherItem.style.display = "flex"
            weatherItem.style.justifyContent = "space-between"
            weatherItem.style.alignItems = "center"
            weatherItem.style.padding = "8px"
            weatherItem.style.borderBottom = "1px solid #ddd"

            const timeElement = document.createElement("h4")
            timeElement.textContent = new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            timeElement.style.margin = "0"
            timeElement.style.flex = "1"

            const weatherInfo = document.createElement("div")
            weatherInfo.style.textAlign = "right"
            weatherInfo.style.flex = "2"
            weatherInfo.innerHTML = `
                <p><strong>Temperature: ${temperature}°C</strong></p>
                <p><strong>Weather:</strong> ${weatherDescription}</p>
                <p><strong>Humidity:</strong> ${humidity}%</p>
            `

            weatherItem.appendChild(timeElement)
            weatherItem.appendChild(weatherInfo)
            weatherContainer.appendChild(weatherItem)
        })
    })

    targetElement.parentNode.insertBefore(title, targetElement.nextSibling)
    targetElement.parentNode.insertBefore(weatherContainer, title.nextSibling)
}
const main = async () => {
    const coords = getCoordsFromPage()
    console.log(coords.latitude, coords.longitude)
    try {
        const response = await fetch(`https://europe-west1-amigo-actions.cloudfunctions.net/recruitment-mock-weather-endpoint/forecast?appid=a2ef86c41a&lat=${coords.latitude}&lon=${coords.longitude}`)
        const data = await response.json()
        console.log(data)
        renderWeatherView(data)

    } catch(error) {
       console.log("error", error)
    }
}

main()
