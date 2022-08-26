export const makeFetch = async (url, method, payload={})=>{
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    let requestOptions = {
        method: method,
        headers: myHeaders,
        ...payload
    };
    return await fetch(process.env.REACT_APP_API + url, requestOptions)
        .then(response => response.json())
        .then(result => result)
        .catch(error => {
            console.log('error', error)
            return null
        });
}
