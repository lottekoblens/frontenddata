const getData = () => {
    // using fetch to get data from API
    // the fetch returns a promise, which consists of an object of the response
    fetch("http://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=netherlands&api_key=f2ab12a57fcca396592451123c0c3ba1&format=json")
        .then(response => response.json())
        .then(data => {
            // pass data to the functions
            deleteUnusedData(data);
            changeKey(data);
            stringToInteger(data);
            sortDuration(data);
            return data
            // return data so you can pass the data to the next then
        }).then(cleanedData => {
            let filteredData = filterDurationZero(cleanedData);
            console.table(filteredData);
        }).catch(err => {
            // if something goes wrong, the error is displayed in the console
            console.error(err);
        })
}

const deleteUnusedData = data => {
    // use forEach to loop over array track. Then I delete the properties that I don't need
    data.tracks.track.forEach(track => {
        delete track.image;
        delete track.mbid;
        delete track.streamable;
    });
}

const changeKey = data => {
    // using a forEach to change the key from 'name' in the array track to 'nameSong'
    data.tracks.track.forEach(track => {
        Object.defineProperty(track, 'nameSong', Object.getOwnPropertyDescriptor(track, 'name'));
        // with the Object.defineProperty() method you can define a 
        // new property on an object or you can change an existing property on an object
        delete track.name;
    })
}

const stringToInteger = data => {
    data.tracks.track.forEach(track => {
        // convert string to Integer for listeners and duration
        track.listeners = parseInt(track.listeners);
        track.duration = parseInt(track.duration);
    })
}

const sortDuration = data => {
    // using sort to display object from highest duration to lowest duration
    // Sam Boot helped me with this code, he explained to me how it works and how I could use it
    data.tracks.track.sort((low, high) => high.duration - low.duration);
}

const filterDurationZero = data => {
    // remove objects whose duration equals to 0
    return data.tracks.track.filter(track => {
           return track.duration > 0;
        })
}

getData();