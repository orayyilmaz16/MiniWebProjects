const apiKey = "f79cef01ae69f4c378bf0d591bcaf3b9";


function getWeather() {
  const city = document.getElementById("cityInput").value;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=tr`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Şehir bulunamadı");
      return response.json();
    })
    .then(data => {
      const result = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p>Sıcaklık: ${data.main.temp}°C</p>
        <p>Durum: ${data.weather[0].description}</p>
        <p>Nem: ${data.main.humidity}%</p>
        <p>Rüzgar: ${data.wind.speed} m/s</p>
      `;
      document.getElementById("weatherResult").innerHTML = result;
    })
    .catch(error => {
      document.getElementById("weatherResult").innerHTML = `<p>${error.message}</p>`;
    });
}
