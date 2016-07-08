let unirest = require('unirest');

const googleapikey = 'AIzaSyDZGfuJuAR3Kr_hLNlW4r-UfKKyDqI29tQ';

exports = module.exports = {
  toUnsigned: (alias, isRemoveSpecial) => {
    var str = alias;
    str= str.toLowerCase(); 
    str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ  |ặ|ẳ|ẵ/g,"a"); 
    str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str= str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ  |ợ|ở|ỡ/g,"o"); 
    str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str= str.replace(/đ/g,"d"); 
    // if(isRemoveSpecial) str= str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|$|_/g,"-");
    //  tìm và thay thế các kí tự đặc biệt trong chuỗi sang kí tự - 
    // str= str.replace(/-+-/g,"-"); //thay thế 2- thành 1-
    // str= str.replace(/^\-+|\-+$/g,""); 
    //cắt bỏ ký tự - ở đầu và cuối chuỗi 
    return str;
  },
  swap: (rs) => {
    for(var i=0, j=rs.length-1; i < j; i++, j--){
      let tmp = rs[i].createat;
      rs[i].createat = rs[j].createat;
      rs[j].createat = tmp;

      tmp = rs[i].updateat;
      rs[i].updateat = rs[j].updateat;
      rs[j].updateat = tmp;
    }
    return rs;
  },
  appendDefaultAttr: (obj, keywords) => {
    if(!obj.createat) obj.createat = new Date();
    if(!obj.updateat) obj.updateat = new Date();
    if(!obj.creator) obj.creator = "Admin";
    if(!obj.keywords) obj.keywords = [];
    if(!obj.viewcount) obj.viewcount = 0;
    if(!obj.utitle) obj.utitle = toUnsigned(obj.title);
    for(var k of keywords){
     if(k.pattern && k.pattern.length > 0){
       let regex = new RegExp(k.pattern, 'igm'); 
       if(regex.test(obj.utitle)){
         obj.keywords.push(k._id);
       }
     }
    }
    return obj;
  },
  getDuration: (str) => {
    if(!str) return '';
    if(str.includes('PT')){
      str = str.substr(2);
    }
    return str;
  },
  applyInfor: (e, keywords, cb) => {    
    let url = 'https://www.googleapis.com/youtube/v3/videos?id=' + e.youtubeid + '&key=' + googleapikey + '&fields=items(snippet(title),contentDetails(duration))&part=snippet,contentDetails';
    unirest('GET', url, {
      'Host': 'www.googleapis.com',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
    }, null, (res)=>{
      if(res.statusCode !== 200) {
        console.error('Get youtube infor error ', res.statusCode, headers, url);
      }
      var item = res.body;
      item = item.items;
      if(item.length > 0) item = item[0];
      if(!e.title || e.title.length === 0) {
        e.title = item.snippet.title;
        e.utitle = exports.toUnsigned(e.title);
      }else{
        e.utitle = exports.toUnsigned(e.title) + "<|>" + exports.toUnsigned(item.snippet.title);
      }         
      e.duration = exports.getDuration(item.contentDetails.duration);
      e = exports.appendDefaultAttr(e, keywords);
      cb(e);
    });
  }
}