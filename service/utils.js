let unirest = require('unirest');

const googleapikey = 'AIzaSyDZGfuJuAR3Kr_hLNlW4r-UfKKyDqI29tQ';

exports = module.exports = {
  googleapikey: googleapikey,
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
    if(isRemoveSpecial) {
      str= str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|$|_|\|/g,"-");     
      str= str.replace(/-+-/g,"-");
      str= str.replace(/^\-+|\-+$/g,""); 
    }
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
    if(!obj.utitle) obj.utitle = exports.toUnsigned(obj.title);
    obj.title0 = exports.toUnsigned(obj.title, true);
    for(var k of keywords){
     if(k.pattern && k.pattern.length > 0){
       let regex = new RegExp(k.pattern, 'igm'); 
       if(regex.test(obj.title) || regex.test(obj.utitle)){
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
  }
}