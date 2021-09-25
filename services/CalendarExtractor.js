const got = require('got');
const exception = require('../routes/Exception.js');
const cheerio = require('cheerio');

const DEFAULT_URL = 'https://www.nautiljon.com/animes/';

const MAX_LIMIT = 150;

const ALL_ANIMES = 0;

// constantes correspondants a l'attribut 'format' du calendrier
const TV_SERIES = 1;
const OAV = 2;
const MOVIES = 3;
const SPECIAL = 4;
const ONA = 5;
const COURT_METRAGE = 8;

// constantes correspondants a l'attribut 'tri' du calendrier
const SORT_DATE = '';
const SORT_POPULARITY = 'p';

// constantes correspondants a l'attribut 'public_averti' du calendrier
const ALL_WITHOUT_HENTAI = 1;
const ONLY_HENTAI = 2;

// constantes correspondantes a l'attribut 'simulcast' du calendrier
const SIMULCAST_ALL = 0;
const SIMULCAST_ADN = 'adn';
const SIMULCAST_NETFLIX = 'netflix';
const SIMULCAST_CRUNCHYROLL = 'crunchyroll';
const SIMULCAST_WAKANIM = 'wakanim';
const SIMULCAST_YOUTUBE = 'youtube';

const DEFAULT_PARAMETERS = [
    'title',
    'type',
    'limit',
    'sort',
    'public',
    'eq_episode',
    'sp_episode',
    'if_episode',
    'simulcast',
    'start_date',
    'eq_rate',
    'sp_rate',
    'if_rate'
];

const get_season = function(date) {
    let month = date.getMonth() + 1;
    switch (month) {
        case 1:
        case 2:
            return 'hiver';
        case 4:
        case 5:
            return 'printemps';
        case 7:
        case 8:
            return 'été';
        case 10:
        case 11:
            return 'automne';

        case 3:
            return date.getDate() >= 21 ? 'printemps' : 'hiver';      
        case 6:
            return date.getDate() >= 21 ? 'été' : 'printemps';
        case 9:
            return date.getDate() >= 21 ? 'automne' : 'été';
        case 12:
            return date.getDate() >= 21 ? 'hiver' : 'automne';
    }
};

const get_page = async function(date, format, sort, public, simulcast) {
    file_name = get_season(date) + '-' + date.getFullYear() + '.html';

    format = 'format=' + format;
    sort = 'tri=' + sort;
    public = 'public_averti=' + public;
    simulcast = 'simulcast=' + simulcast;

    let new_url = DEFAULT_URL + file_name + '?' + format + '&' + sort + '&' + public + '&' + simulcast;
    let response = await got(new_url);
    return response.body;
};

const date_format = function(string_date) {
    let dates = string_date.split('/').reverse();
    let year = dates[0];
    let month = dates.length >= 2 ? '-' + dates[1] : '';
    let day = dates.length >= 3 ? '-' + dates[2] : '';
    return year + month + day;
}


const check_parameters_format = function(parameters) {
    let amount = Object.keys(parameters).length;
    let r = 0;
    Object.keys(parameters).forEach((param) => {
        r = DEFAULT_PARAMETERS.includes(param) ? r + 1 : r;
    });
    return r == amount;
}

const check_parameters = function(anime, parameters) {
    let result = true;

    if(result && parameters['title'] != undefined) {
        result = anime.title.toLowerCase().includes(parameters['title'].toLowerCase());
    }

    if(result && parameters['type'] != undefined) {
        result = anime.type.toLowerCase().replace('é', 'e').replace(' ', '_') === parameters['type'].toLowerCase();
    }

    if(result && parameters['eq_episode'] != undefined) {
        result = anime.episodes != '?' && parseInt(anime.episodes) == parseInt(parameters['eq_episode']);
    }

    if(result && parameters['sp_episode'] != undefined) {
        result = anime.episodes != '?' && parseInt(anime.episodes) <= parseInt(parameters['sp_episode']);
    }

    if(result && parameters['if_episode'] != undefined) {
        result = anime.episodes != '?' && parseInt(anime.episodes) <= parseInt(parameters['if_episode']);
    }

    if(result && parameters['simulcast'] != undefined) {
        result = anime.simulcasts.includes(parameters['simulcast'].toLowerCase());
    }

    if(result && parameters['start_date'] != undefined) {
        let date = new Date(parameters['start_date']);
        let anime_date = new Date(anime.start_date);
        result = !isNaN(date) && !isNaN(anime_date) && date.getTime() == anime_date.getTime();
    }

    if(result && parameters['eq_rate'] != undefined) {
        let rate = parseFloat(anime.rate.split('/')[0]);
        result = !isNaN(rate) && rate == parseFloat(parameters['eq_rate']);
    }

    if(result && parameters['sp_rate'] != undefined) {
        let rate = parseFloat(anime.rate.split('/')[0]);
        result = !isNaN(rate) && rate >= parseFloat(parameters['sp_rate']);
    }

    if(result && parameters['if_rate'] != undefined) {
        let rate = parseFloat(anime.rate.split('/')[0]);
        result = !isNaN(rate) && rate <= parseFloat(parameters['if_rate']);
    }

    return result;
}

const get_json = function(body, parameters = null) {
    let execute_time = new Date();
    let result_json = { 'animes_amount' : 0, 'animes': [], 'exec_time' : 0.0 };
    let $ = cheerio.load(body);
    let amount = 0;
    let limit = 30;
    if(parameters != null) {
        if(check_parameters_format(parameters) == false) {
            return exception.error_exception('invalid parameters');
        }
        if(parameters['limit'] != undefined) {
            limit = parameters['limit'];
            limit = limit > MAX_LIMIT ? MAX_LIMIT : limit;
            limit = limit < 0 ? 0 : limit;
        }
    }

    $('div.bgcolor > div.elt').each(function(i, element) {
        
        let kinds = [];
        let simulcasts = [];
        let title = $(this).find($('h2 > a.bloc_elt_titre')).text();
        let anime_page = DEFAULT_URL + $(this).find($('div.title > h2 > a')).attr('href').replace('/animes/', '');
        let type = $(this).find($('div.infos > span:nth-child(1)')).text();
        let n_episodes = $(this).find($('div.infos > span:nth-child(3)')).text().split(' ')[0];
        $(this).find($('div.genres > a')).toArray().map((x) => { kinds.push($(x).text())})
        let image_url = $(this).find($('a.sim > div')).css('background-image').replace('url(', '').replace(')', '');
        let description = $(this).find($('div.texte')).text();
        let company = $(this).find($('div.infos > span > a')).text();
        let dates = $(this).find($('div.infos2 > span:nth-child(1)')).text().split(' ');
        let release_date = date_format(dates[0]);
        let end_date = dates.length >= 3 ? date_format(dates[2]) : '?';
        let rate = $(this).find($('div.infos2 > span:nth-child(2)')).text().trim();
        $(this).find($('a.sim > div > span > img')).toArray().map((x) => { 
            let src = $(x).attr('src');
            simulcasts.push(src.substring(src.lastIndexOf('/') + 1, src.indexOf('.'))); 
        });

        let anime = {
            'title' : title,
            'anime_page' : anime_page,
            'type' : type,
            'episodes' : n_episodes,
            'kinds' : kinds,
            'simulcasts' : simulcasts,
            'image' : image_url,
            'company' : company,
            'description' : description,
            'rate' : rate,
            'start_date' : release_date,
            'end_date' : end_date
        };
        
        let result = true;
        if(parameters != null) {
            result = check_parameters(anime, parameters);
        }

        if(result) {
            result_json.animes.push(anime);
            amount = amount + 1;
        }
        if(amount >= limit) {
            return false;
        }
        
    });

    execute_time = (new Date()).getTime() - execute_time.getTime();
    execute_time = execute_time / 1000.0;
    result_json.animes_amount = amount;
    result_json.exec_time = execute_time;
    return result_json;
}

const get_calendar = async function(date = new Date().getTime(), format = ALL_ANIMES, sort = SORT_DATE, public = ALL_WITHOUT_HENTAI, simulcast = SIMULCAST_ALL, parameters = null) {
    this.execute_time = new Date().getTime();
    if(date === null || date === undefined) {
        return exception.error_exception('date is null or undefined');
    }

    let select_date = new Date(date);

    if(isNaN(select_date)) {
        return exception.error_exception('date format is invalid');
    }

    let body = await get_page(select_date, format, sort, public, simulcast);
    return get_json(body, parameters);

};

exports.getCalendar = get_calendar;
exports.check_parameters_format = check_parameters_format;
exports.ALL_ANIMES = ALL_ANIMES;
exports.TV_SERIES = TV_SERIES;
exports.OAV = OAV;
exports.MOVIES = MOVIES;
exports.SPECIAL = SPECIAL;
exports.ONA = ONA;
exports.COURT_METRAGE = COURT_METRAGE;
exports.SORT_DATE = SORT_DATE;
exports.SORT_POPULARITY = SORT_POPULARITY;
exports.ALL_WITHOUT_HENTAI = ALL_WITHOUT_HENTAI;
exports.ONLY_HENTAI = ONLY_HENTAI;
exports.SIMULCAST_ALL = SIMULCAST_ALL;
exports.SIMULCAST_ADN = SIMULCAST_ADN;
exports.SIMULCAST_NETFLIX = SIMULCAST_NETFLIX;
exports.SIMULCAST_CRUNCHYROLL = SIMULCAST_CRUNCHYROLL;
exports.SIMULCAST_WAKANIM = SIMULCAST_WAKANIM;
exports.SIMULCAST_YOUTUBE = SIMULCAST_YOUTUBE;