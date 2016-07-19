const MAX_SIZE = 6;

module.exports = class HashService {
  
  static decrypt(sf, type) {
    sf = sf.replace(/\0/g, '=');
    sf = sf.split('');
    for (var i = 0; i < sf.length - 1; i += 2) {
      if(i >= MAX_SIZE) break;
      if (i + 1 < sf.length && sf[i] != '=' && sf[i + 1] != '=') {
        var tmp = sf[i];
        sf[i] = sf[i + 1];
        sf[i + 1] = tmp;
      }
    }
    sf = sf.join('');
    return Buffer.from(sf, type || 'hex').toString();
  }

  static encrypt(data, type) {
    if(data === null || data === undefined) return data;
    data = JSON.stringify(data);
    let sf = Buffer.from(data).toString(type || 'hex');
    sf = sf.split('');
    for (let i = 0; i < sf.length - 1; i += 2) {
      if(i >= MAX_SIZE) break;
      if (i + 1 < sf.length && sf[i] != '=' && sf[i + 1] != '=') {
        let tmp = sf[i];
        sf[i] = sf[i + 1];
        sf[i + 1] = tmp;
      }
    }
    sf = sf.join('').replace(/=/g, '\0');
    return sf;
  }

}