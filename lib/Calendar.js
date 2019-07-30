"use strict";

const ejs = require("ejs");
const moment = require("moment");
const crypto = require('crypto');
const os = require("os");

const xmlParser = require("./xml/parser");
const xml = require("./xml");

const byTimeTemplate = ejs.compile(xml.byTime);
const tasksPendingByTimeTemplate = ejs.compile(xml.tasksPendingByTime);
const multigetTemplate = ejs.compile(xml.multiget);
const addTaskTemplate = ejs.compile(xml.addTask);

function getCalDate(date){
	var mDate = moment(date);
	mDate.utc();
	return mDate.format("YYYYMMDD[T]HHmmss[Z]");
}

function getCalString(s){
	const regexp = /([\\;,])/gmi;
	const subst = "\\$1";
	return (s + '').replace(regexp,subst).replace(/(\n)/gm,'\\n');
}

function md5(data){
	return crypto.createHash('md5').update(data).digest('hex');
}

function createCalendar(request) {
    class Calendar {
        constructor(config) {
            if (!config) {
                throw new Error("Missing config object");
            }
            this.config = config;
        }

        /**
         * Request ctag.
         * With an ctag you can see if anything in the calendar has changed.
         *
         * @returns {Promise}
         */
        getCtag() {
            return request(this.config, "PROPFIND", 0, xml.calendarCtag).then(xmlParser.parseCalendarMultistatus);
        }

        /**
         * Request etags.
         * With an etag you can see if anything in the event has changed.
         *
         * @returns {Promise}
         */
        getEtags() {
            return request(this.config, "REPORT", 1, xml.eventsEtag).then(xmlParser.parseEventsMultistatus);
        }

        /**
         * Fetch events with details, which are given with 'events'.
         * 'events' has to be an array with event objects which look like { ics: "/calendars/user/calendar_name/123456789.ics" }.
         *
         * @param {Array} events
         * @returns {Promise}
         */
        getEvents(events) {
            if (Array.isArray(events) === false || events.length === 0) {
                throw new TypeError("getEvents() expects an array of objects with event ids");
            }

            const multiget = multigetTemplate({gets: events});

            return request(this.config, "REPORT", 1, multiget).then(xmlParser.parseEvents);
        }

        /**
         * Fetch all events.

        *
        * @returns {Promise}
        */
        getAllEvents() {
            return request(this.config, "REPORT", 1, xml.calendarQuery).then(xmlParser.parseEvents);
        }
        
        /**
         * Fetch all tasks.

         *
         * @returns {Promise}
         */
        getAllTasks() {
        	return request(this.config, "REPORT", 1, xml.taskQuery).then(xmlParser.parseTasks);
        }
        
        /**
         * Add new task.
         * 'task' object can have all the property of a vtodo
         * More informations can be found at https://www.kanzaki.com/docs/ical/vtodo.html
         * All dates must be a JS Date object
         * 'alarm' is reserved for future use
         * @param {Object} task
         * @param {Object} alarm
         * @returns {Promise}
         */
        addTask(task,alarm) {
        	var taskSanitized = {};
        	var forbiddenDup = ['CLASS','COMPLETED','CREATED','DESCRIPTION','DTSTAMP','DTSTART','GEO','LAST-MODIFIED','LOCATION','ORGANIZER','PERCENT','PRIORITY','RECURID','SEQ','STATUS','SUMMARY','UID','URL']; //Thoses tags MUST appear only once (or not)
        	
        	//Ajoute la date de création, modification
			    taskSanitized['DTSTAMP'] = getCalDate(Date.now());
			    taskSanitized['CREATED'] = taskSanitized['DTSTAMP'];
			    taskSanitized['LAST-MODIFIED'] = taskSanitized['DTSTAMP'];
			
			    //Sanitize dates
			    if (task.completed){
				    taskSanitized['COMPLETED'] = getCalDate(task.completed);
			    }
			
			    var start = task.dtstart || task.start;
			    if (start){
				    taskSanitized['DTSTART'] = getCalDate(start);
			    }
			
			    var end = task.due || task.end;
			    if (end && task.duration){
				    throw new Error("Only Due OR Duration must occur");
			    }
			    
			    if (end){
				    if (start){
					    if (moment(end).isSame(moment(start))) {
						    //La fin doit être strictement après le début, on ajoute une seconde
						    end = moment(end);
						    end.add(1,'seconds');
					    }else if (moment(end).isBefore(moment(start))){
						    throw new Error("Due date must be after start date !");
					    }
				    }
				    taskSanitized['DUE'] = getCalDate(end);
			    }else if (task.duration){
				    taskSanitized['DURATION'] = moment.duration(task.duration).toISOString();
			    }
			    
			    //Sanitize numbers
			    if (task.priority){
				    taskSanitized['PRIORITY'] = parseInt(task.priority);
			    }
			    
			    if (task.percent){
				    taskSanitized['PERCENT'] = parseInt(task.percent);
			    }
			    
			    //Sanitize lists
			    if (Array.isArray(task.categories)){
				    taskSanitized['CATEGORIES']=task.categories.join(',');
			    }
			    
			    //Others
			    if (!task.status){
				    taskSanitized['STATUS'] = 'NEEDS-ACTION';
			    }
			    if (!task.uid){
				    taskSanitized['UID'] = md5(taskSanitized['DTSTAMP'] + '@' + os.hostname() + JSON.stringify(task));
			    }
			    
			    //For everything else, sanitize key and escape value as text and copy it
			    for (var key in task){
				    var keyUpDash = key.replace(/([A-Z])/g,'-\\1').toUpperCase();
				    if (!taskSanitized[keyUpDash] && keyUpDash!='END' && keyUpDash!='START'){ //A-t-on appliqué un traitement spécifique ?
					    if (Array.isArray(task[key])){
						    if (task[key].length >1 && forbiddenDup.includes(keyUpDash)){
							    throw new Error(key + ": must appear only once");
						    }else{
							    taskSanitized[keyUpDash] = [];
							    task[key].forEach(function(item){
								    taskSanitized[keyUpDash].push(getCalString(item));
							    });
						    }
					    }else{
						    taskSanitized[keyUpDash] = getCalString(task[key]);
					    }
				    }
			    }
			
			    //Créer le contenu de la requete avec le template et ces données
			    //TODO : add valarm support
        	var xmlRequest = addTaskTemplate({vtodo:taskSanitized,valarm:alarm});
        	xmlRequest = xmlRequest.replace(/\n/g,'\r\n');
        	
        	//Définie une url unique pour cet évènement
        	var config = {};
        	for (var key in this.config){
        		config[key]= this.config[key];
        	}
        	config.uri = config.uri + taskSanitized['UID'];
        	
        	//Lance la requête
        	return request(config, "PUT", 1, xmlRequest).then(xmlParser.parseAddTask);
        }

        /**
         * Generally fetches all upcoming events from today,
         * but you can widen or narrow your search with 'start' and 'end'.
         * The end-date must be larger than the start date.
         *
         * The date has to be in iCal format, like so '20150101T000000Z'.
         * You can get more information on that here:
         * http://www.kanzaki.com/docs/ical/dateTime.html.
         *
         * @param {string} start
         * @param {string} end
         * @returns {Promise}
         */
        getEventsByTime(start, end) {
            start = start || moment().startOf("day")
                .format("YYYYMMDD[T]HHmmss[Z]");
            end = end || null;

            if (Boolean(end) && moment(end).isSameOrBefore(start)) {
                // CalDAV requires end-date to be larger than start-date
                end = null;
            }

            const xmlRequest = byTimeTemplate({start, end});

            return request(this.config, "REPORT", 1, xmlRequest)
                .then(xmlParser.parseEvents)
                .then(events => {
                    return events.filter(event => {
                        const isNotRecurring = !event.data.type.recurring;
                        const isSameDayOrAfter = moment(event.data.start).isSameOrAfter(start, "day");

                        return isNotRecurring || isSameDayOrAfter;
                    });
                });
        }
        
        /**
         * Return all pending tasks and finished tasked not older than 'backintime' (default to 1 year old)
         * 'backintime' is a momentJS object describing a duration
         * @param {Object} backintime
         * @returns {Promise}
         */
        getPendingOrRecentTasks(backintime) {
        	var backintime = backintime || {years:1};
            var start = moment().startOf("day").subtract(backintime).format("YYYYMMDD[T]HHmmss[Z]");

            const xmlRequest = tasksPendingByTimeTemplate({start});

            return request(this.config, "REPORT", 1, xmlRequest).then(xmlParser.parseTasks);
       
        }
    }

    return Calendar;
}

module.exports = createCalendar;
