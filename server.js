const Hapi = require('hapi');
const corsHeaders = require('hapi-cors-headers');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000 
});

// Add the route

server.route({
  method: 'GET',
  path:'/install',
  handler: function (request, reply) {
    var c = [{ name: "18+",               pattern: '18\+' }
            ,{ name: "5s Online",         pattern: '5s online' }
            ,{ name: "Ẩm thực",           pattern: 'am thuc|che bien|mon an|bua an' }
            ,{ name: "Ảo thuật",          pattern: 'ao thuat|magic|ao thuat|takayama|magic|dynamo' }
            ,{ name: "Bạn muốn hẹn hò",   pattern: 'ban muon hen ho' }
            ,{ name: "Bóng đá",           pattern: 'bong da|messi|neymar|football|ghi ban|ban thang|thu mon|penalty|cau thu|van persie|cu sut|sut phat|lam ban|pha bong|cuu thua|tien dao|trung ve|hau ve|world cup|worldcup|fifa|(ronal\w+)|re bong|sut truot|copa america|andy cole|da phat|goals?|moc bong|gareth bale|tang bong|di bong|tranh bong' }
            ,{ name: "Ca nhạc",           pattern: 'ca nhac|nghe roi cam nhận|nghe se nghien|taylor|mv|son tung|bai nay|maroon|nguyen dinh vu|big bang|bigbang|rap|ca khuc|music|ban nhac|mashup|bai hat|hoai lam|khac viet|oficial' }
            ,{ name: "Cảnh giác",         pattern: '' }
            ,{ name: "Công nghệ",         pattern: 'dong ho|xe may|may tinh bang|iphone|ipad|android|window phone|lumina|sieu xe|che tạo|cong nghe|airline|ferrari|lamborghini|laser|bphone|chiec xe|tuong lua|nam cham|dong co' }
            ,{ name: "Dễ thương",         pattern: 'de thuong|dang yeu|dang iu' }
            ,{ name: "Độc & lạ",          pattern: 'chuyen la|ki luc|bi an|doc dao' }
            ,{ name: "Đời sống xã hội",   pattern: 'quan doi|phien quan|csgt|canh sat|nhat ky 141|công an|tù nhân|giang hồ|lê thẩm dương|giết người|cướp của|cướp tài sản|bốc đầu|đánh ghen|đánh nhau|chém nhau|ngáo đá|ăn trộm|ăn cướp|say xỉn|chống đối|chống người|ô tô đâm|đẫm máu|cháy|tàu chiến|tên lửa|cãi nhau|hành hạ|giao thông|vụ tai nạn|băng cướp|tự tử' }
            ,{ name: "Động vật",          pattern: 'động vật|chó|mèo|cờ hó|dog|khỉ|voi|ngựa|rắn|pet|con vật|con thú|sư tử|bạch tuộc|chim|thằn lằn|loại vật|tinh tinh|rết|hải sâm|cá mập' }
            ,{ name: "Game",              pattern: 'crossfire|nfs|rengar|đế chế|gta|game|gameplay' }
            ,{ name: "Game show",         pattern: 'thách thức danh hài|danh hài đất việt|cười xuyên việt' }
            ,{ name: "Hàn quốc",          pattern: 'korea|han\\s?quoc|han\\s?xeng' }
            ,{ name: "Khoa học",          pattern: 'khoa học|vũ trụ|nasa' }
            ,{ name: "Kpop",              pattern: 'kpop' }
            ,{ name: "LOL",               pattern: 'lol|league of legends|liên minh huyền thoại|azir|yasuo|rengar|jinx|vayne|leblanc|ashe|ekko|faker|karthus|trundle|Teemo|wukong|Graves Montage|outplays?|Riot' }
            ,{ name: "Manga",             pattern: 'naruto|onepiece|one piece|anime|sasuke|itachi|madara|hoạt hình|Zoro|Robin|luffy|Larva|Ấu Trùng Tinh Ngịch|Goku|Doreamon|Doramon|Doremon|Doraemon' }
            ,{ name: "Nghệ thuật",        pattern: 'bartender|nghệ thuật|hiphop|bboy|vẽ|múa|trống|hip hop|beatbox|slow motion|smoke tricks' }
            ,{ name: "Người bí ẩn",       pattern: 'nguoi bi an' }
            ,{ name: "Nhật bản",          pattern: 'nhat ban|japan' }
            ,{ name: "Nonstop",           pattern: 'non\\s?stop' }
            ,{ name: "Pháp luật",         pattern: 'cong an|canh sat' }
            ,{ name: "Phim hài",          pattern: 'cười thả ga|faptv|hài nhật bản|vitamin k|đông hiếp|hài hàn quốc|gặp nhau để cười|phim ngắn mốc meo|việt hương|chí tài|hoài linh|phim.*?hài|phim.*?hai|Để Hội Hack' }
            ,{ name: "Phim ngắn",         pattern: 'phim|nhật ký sa tăng|film' }            
            ,{ name: "Phim võ thuật",     pattern: 'lý tiểu long|chung tử đơn|lý liên kiệt|thành long|jason staham|tony jaa|ngô kinh|đấu võ|võ đài|phim võ thuật|phim hành động|thủy hử|lương sơn bạc|cao thủ|võ lâm|tịnh tà kiếm phổ|dương quá|kim dung|quyết đấu|đông phương|lệnh hồ|nhậm ngã hành|nhậm doanh doanh|kiếm phổ|lộc đỉnh ký|Hiên Viên Kiếm|Thần công' }
            ,{ name: "Phong trào",        pattern: '' }
            ,{ name: "Series hài",        pattern: 'troll|prank|siêu hài canada|những thằng nguy hiểm nhất hành tinh|tổng hợp những pha|tuyển tập những thằng|tổng hợp những màn|funny video(s?)|hài hước|mắc cười|prank|Những thằng nghịch ngu nhất|pranks' }
            ,{ name: "Thái lan",          pattern: 'thai lan|thailand' }
            ,{ name: "Thể thao",          pattern: 'bóng rổ|bong ro|bóng bàn|bong ban|tennis|cầu lông|cau long|quần vợt|quan vot|chạy bộ|penalty|trượt tuyết|truot tuyet|chạy thi|thi chạy|parkour|ném dao|thể thao|drift|vận động viên|Skate ?boarding' }
            ,{ name: "Thể thao mạo hiểm", pattern: 'mao hiem' }
            ,{ name: "The voice",         pattern: 'the\\s?voice' }
            ,{ name: "Trung Quốc",        pattern: 'trung quoc|china|chinese' }
            ,{ name: "US",                pattern: 'us|america' }
            ,{ name: "Việt Nam",          pattern: 'viet\\s?nam' }
            ,{ name: "Vlog",              pattern: 'vlog|vinh râu|phở đặc biệt|Nghịch \d+' }
            ,{ name: "Võ thuật",          pattern: 'karate|takewondo|võ sĩ|diễn võ thuật|wwe|thiếu lâm|võ thuật|múa kiếm' }
            ,{ name: "VPop",              pattern: 'vpop' }
            ,{ name: "Got talent",        pattern: 'talent|gottalent' }
            ,{ name: "XFactor",           pattern: 'x\s?factor|nhân tố bí ẩn' }
            ,{ name: "Ý nghĩa",           pattern: 'cảm động|ý nghĩa|quà tặng cuộc sống|lòng tốt|tấm lòng' }];
    var db = request.server.plugins['hapi-mongodb'].db;
    var tbl = db.collection('keyword');
    var data = [];
    var toUnsigned = (alias, isRemoveSpecial) => {
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
    }
    for(var i of c){
      i.pattern = toUnsigned(i.pattern.toLowerCase());
      i.createat = new Date();
      i.updateat = new Date();
      data.push(i);
    }
    tbl.insertMany(data, function(err, r){
      reply(r);
    })    
  }
});

server.route({
  method: 'GET',
  path:'/keywords',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('keyword').find({}).sort([['updateat', -1]]).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/keyword',
  handler: function (request, reply) {
    var keyword = request.query.keyword;
    if(!keyword) return reply(null);
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;    
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({keywords: keyword}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/newest',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/search',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    var txtSearch = request.query.txtSearch;
    page = parseInt(page);
    rows = parseInt(rows);

    var where = {};
    if(txtSearch){
      where['$text'] = { $search: txtSearch };
    }

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find(where).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/relate',
  handler: function (request, reply) {
    var id = request.query.id;
    if(!id) return reply(null);
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/most',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/hot',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      rs.viewcount++;
      db.collection('clip').updateOne({_id: rs._id}, { $set: { viewcount : rs.viewcount } }, (err, rs0) => {
        reply(rs);
      });      
    });
  }
});

server.ext('onPreResponse', corsHeaders);
server.register({
  register: require('hapi-mongodb'),
  options: {
    "url": "mongodb://localhost:27017/test",
    "settings": {
      "db": {
        "native_parser": false
      }
    }
  }
}, function (err) {
  if (err) {
    console.error(err);
    throw err;
  }

  // Start the server
  server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
  });
});