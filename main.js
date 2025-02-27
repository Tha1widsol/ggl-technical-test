const getCoordsFromPage = () => {
    let scriptData = document.getElementById("__NEXT_DATA__")?.textContent
    if (!scriptData) return
    let jsonData = JSON.parse(scriptData)

    const traverse = (obj) => {
        if (!obj || typeof obj !== "object") return
        if (obj.location) return obj.location

        for (let key in obj) {
            let result = traverse(obj[key])
            if (result) return result
        }
    }

    let locationData = traverse(jsonData)
    return locationData?.latitudeLongitude
}

const createWeatherCard = (forecast) => {
    const { main, weather, dt_txt: time } = forecast
    const temperature = main?.temp?.toFixed(1) ?? "N/A";
    const weatherDescription = weather?.[0]?.description ?? "No Description"
    const humidity = main?.humidity ?? "N/A"

    const weatherItem = document.createElement("div")
    Object.assign(weatherItem.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        marginBottom: "8px",
    })

    const timeElement = document.createElement("h4");
    timeElement.textContent = new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    Object.assign(timeElement.style, {
        margin: "0",
        flex: "1",
        fontSize: "1.1em",
        fontWeight: "bold",
        color: "#333",
    })

    const weatherInfo = document.createElement("div");
    Object.assign(weatherInfo.style, {
        textAlign: "right",
        flex: "2",
        fontSize: "1em",
        color: "#444",
    })

    weatherInfo.innerHTML = `
        <p style="margin: 4px 0;"><strong>Temperature:</strong> ${temperature}°C</p>
        <p style="margin: 4px 0;"><strong>Weather:</strong> ${weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1)}</p>
        <p style="margin: 4px 0;"><strong>Humidity:</strong> ${humidity}%</p>
    `;

    weatherItem.appendChild(timeElement)
    weatherItem.appendChild(weatherInfo)

    return weatherItem
};


const renderWeatherView = (data) => {
    const targetElement = document.querySelector("div[data-testid='place-summary-links']")
    if (!targetElement) {
        return
    }

    const container = document.createElement("div")
    targetElement.after(container)

    const todayHeader = document.createElement("h2")
    todayHeader.textContent = "Today's Weather"
    container.appendChild(todayHeader)

    const today = new Date().toISOString().split("T")[0]
    const todayForecasts = data.list.filter(forecast => forecast.dt_txt.startsWith(today))

    if (todayForecasts.length > 0) {
        const todayCard = document.createElement("div")
        Object.assign(todayCard.style, {
            padding: "15px", marginBottom: "15px", border: "1px solid #ccc",
            borderRadius: "8px", backgroundColor: "#ffefc1",
            maxHeight: "300px", overflowY: "auto"
        })

        todayForecasts.forEach(forecast => todayCard.appendChild(createWeatherCard(forecast)))
        container.appendChild(todayCard)
    }

    const forecastHeader = document.createElement("h2")
    forecastHeader.textContent = "Weather Forecast"
    container.appendChild(forecastHeader)

    const weatherContainer = document.createElement("div")
    Object.assign(weatherContainer.style, {
        maxHeight: "400px", overflowY: "auto", padding: "10px",
        border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9"
    })

    const groupedData = data.list.reduce((acc, forecast) => {
        const dateStr = forecast.dt_txt.split(" ")[0]
        if (dateStr !== today) {
            acc[dateStr] = acc[dateStr] || []
            acc[dateStr].push(forecast)
        }
        return acc
    }, {})

    Object.entries(groupedData).forEach(([date, forecasts]) => {
        const dateHeader = document.createElement("h3")
        dateHeader.textContent = new Date(date).toLocaleDateString("en-GB")
        weatherContainer.appendChild(dateHeader)

        const dateSection = document.createElement("div")
        Object.assign(dateSection.style, {
            marginTop: "15px", padding: "10px", border: "1px solid #ddd",
            borderRadius: "8px", backgroundColor: "#e3f2fd"
        })

        forecasts.forEach(forecast => dateSection.appendChild(createWeatherCard(forecast)))
        weatherContainer.appendChild(dateSection)
    })

    container.appendChild(weatherContainer)
}

const main = async () => {
    const coords = getCoordsFromPage()
    if (!coords) {
        console.error("Cannot find coordinates")
        return
    }

    console.log(coords.latitude, coords.longitude)

    try {
        const response = await fetch(`https://europe-west1-amigo-actions.cloudfunctions.net/recruitment-mock-weather-endpoint/forecast?appid=a2ef86c41a&lat=${coords.latitude}&lon=${coords.longitude}`)
        const data = await response.json()
        renderWeatherView(data)
    } catch (error) {
        console.error("Error fetching weather data", error)
    }
}

main()
