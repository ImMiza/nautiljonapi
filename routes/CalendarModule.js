const calendar_extractor = require('../services/CalendarExtractor.js');
const exception = require('./Exception.js');
const express = require('express');
var router = express.Router();

const get_format = function(type) {
    switch (type.toLowerCase()) {
        case 'all':
            return calendar_extractor.ALL_ANIMES;
        case 'serie_tv':
            return calendar_extractor.TV_SERIES;
        case 'oav':
            return calendar_extractor.OAV;
        case 'film':
            return calendar_extractor.MOVIES;
        case 'special':
            return calendar_extractor.SPECIAL;
        case 'ona':
            return calendar_extractor.ONA;
        case 'court-metrage':
            return calendar_extractor.COURT_METRAGE;
        
        default:
            return calendar_extractor.ALL_ANIMES;
    }
}

const get_sort = function(sort) {
    switch (sort.toLowerCase()) {
        case 'date':
            return calendar_extractor.SORT_DATE;
        case 'popularity':
            return calendar_extractor.SORT_POPULARITY;

        default:
            return calendar_extractor.SORT_DATE;
    }
}

const get_public = function(public) {
    switch (public.toLowerCase()) {
        case 'all':
            return calendar_extractor.ALL_ANIMES;
        case 'all_without_hentai':
            return calendar_extractor.ALL_WITHOUT_HENTAI;
        case 'only_hentai':
            return calendar_extractor.ONLY_HENTAI;
    
        default:
            return calendar_extractor.ALL_WITHOUT_HENTAI;
    }
}

const get_simulcast = function(simulcast) {
    switch (simulcast.toLowerCase()) {
        case 'all':
            return calendar_extractor.SIMULCAST_ALL;
        case 'adn':
            return calendar_extractor.SIMULCAST_ADN;
        case 'netflix':
            return calendar_extractor.SIMULCAST_NETFLIX;
        case 'crunchyroll':
            return calendar_extractor.SIMULCAST_CRUNCHYROLL;
        case 'wakanim':
            return calendar_extractor.SIMULCAST_WAKANIM;
        case 'youtube':
            return calendar_extractor.SIMULCAST_YOUTUBE;
    
        default:
            return calendar_extractor.SIMULCAST_ALL;
    }
}

router.get('/api/calendar', function(req, res) {

        if(Object.keys(req.query).length == 0) {
            calendar_extractor.getCalendar()
            .then(result => {
                res.json(result);
                res.end();
            })
            .catch(error => {
                res.json(exception.error_exception('calendar exception'));
                res.end();
            });
        }
        else {
            let check = calendar_extractor.check_parameters_format(req.query);
            
            if(check) {
                let format = req.query.type != undefined ? get_format(req.query.type) : calendar_extractor.ALL_ANIMES;
                let sort = req.query.sort != undefined ? get_sort(req.query.sort) : calendar_extractor.SORT_DATE;
                let public = req.query.public != undefined ? get_public(req.query.public) : calendar_extractor.ALL_WITHOUT_HENTAI;
                let simulcast = req.query.simulcast != undefined ? get_simulcast(req.query.simulcast) : calendar_extractor.SIMULCAST_ALL;

                calendar_extractor.getCalendar(req.query.start_date != undefined ? new Date(req.query.start_date) : new Date(), format, sort, public, simulcast, req.query)
                .then(result => {
                    res.json(result);
                })
                .catch(error => {
                    res.json(error);
                });
            }
            else {
                res.json(exception.error_exception('invalid parameters'));
            }
            
        }

    });

module.exports = router;
