const ReadableTime=(ms)=>{
    if(ms<1000){
        return ms+'ms'
    }else if(ms<1000*60){
        return Math.floor(ms/1000)+'s'
    }else if(ms<1000*60*60){
        return Math.floor(ms/1000/60)+'m'
    }else if(ms<1000*60*60*24){
        return Math.floor(ms/1000/60/60)+'h'
    }else{
        return Math.floor(ms/1000/60/60/24)+'d'
    }
}
export default ReadableTime