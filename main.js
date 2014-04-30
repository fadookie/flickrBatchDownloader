/**
 * Flickr photoset original link page script
 * Copyright (c) 2014 Eliot Lash
 */

/*jslint
 browser: true,
 plusplus: true,
 vars: true,
 closure: true,
 devel: true
 */

(function () {
    "use strict";
    var setId = 0;
    var delimDefault = " ";
    var delim = delimDefault;
    var cachedResults = { "setId" : null, "results" : null  };

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1),
            vars = query.split("&"),
            i = 0,
            pair = 0;
        for (i = 0; i < vars.length; i++) {
            pair = vars[i].split("=");
            if (pair[0] === variable) {
                return pair[1];
            }
        }
        return false;
    }

    document.addEventListener("DOMContentLoaded", function () {
        setId = getQueryVariable("setId");
        delim = decodeURIComponent(getQueryVariable("delim"));
        if (setId) {
            document.forms[0].elements.setId.value = setId;
            document.forms[0].elements.delim.value = delim;
        }
    });

    function getQueryURL(photosetId) {
        var params = [ "format=json", "callback=parse" ];

        //Use author's query alias, for speed and simplicity
        var baseUrl = "https://query.yahooapis.com/v1/public/yql/Eliot/GetOriginalURLsForPhotoset?";
        params.push("photosetId=" + photosetId);
        //Here is the source for my query alias, copied from the yql console:
        //SELECT source FROM flickr.photos.sizes WHERE api_key='7eea1b72a929941c0e2c6e74c36d7d4a' AND label='Original' AND photo_id IN (SELECT id FROM flickr.photosets.photos(0) WHERE api_key='7eea1b72a929941c0e2c6e74c36d7d4a' AND photoset_id=@photosetId)

        //This is how you'd do it without a query alias:
        //var baseUrl = "https://query.yahooapis.com/v1/public/yql?";
        //var apiKey = "YOUR FLICKR API KEY";
        //var query = "SELECT source FROM flickr.photos.sizes WHERE api_key='{0}' AND label='Original' AND photo_id IN (SELECT id FROM flickr.photosets.photos(0) WHERE api_key='{0}' AND photoset_id='{1}')".format(apiKey, photosetId);
        //params.push("q={0}".format(encodeURIComponent(query)));

        var finalUrl = baseUrl + params.join('&');
        return finalUrl;
    }

    function setResult(resultMarkup) {
        var list = document.getElementById("results");
        list.innerHTML = resultMarkup ? resultMarkup.join(delim) : "";
    }

    function setSpinner(show) {
        if (show) {
            document.getElementById("spinner").className = "";
        } else {
            document.getElementById("spinner").className = "hidden";
        }
    }

    window.fetchSet = function fetchSet() {
        var lSetId = document.forms[0].elements.setId.value;
        var lDelim = document.forms[0].elements.delim.value;
        if (!lSetId) {
            setResult(['<p class="error">Please enter a photoset ID.</p>']);
            return false;
        }

        setId = lSetId;

        if (lDelim) {
            delim = lDelim;
        } else {
            delim = delimDefault;
        }

        if (lSetId === cachedResults.setId) {
            //Just used cached results
            console.log("using cached result: " + cachedResults);
            window.parse(cachedResults.result);
            return false;
        }

        var url = getQueryURL(lSetId);
        console.log("fetch " + url);

        //Start JSONP request to YQL service - callback is "parse" function
        var script = document.createElement("script");
        script.setAttribute("src", url);
        document.head.appendChild(script);

        setSpinner(true);
        setResult([]);
        return false; //Don't bother submitting the form as this will cause the page to refresh
    };

    window.parse = function parse(result) {
        var newItems = [ ];
        if (!result || result.query.count === 0) {
            var errorMsg = "No results found. Response: {0}".format(result);
            console.log(errorMsg);
            newItems.push('<p class="error">{0}</p>'.format(errorMsg));
            setResult(newItems);
            setSpinner(false);
            return;
        }

        cachedResults.setId = setId;
        cachedResults.result = result;

        result.query.results.size.forEach(function (imageSize) {
            newItems.push('<a href="{0}">{0}</a>'.format(imageSize.source));
        });
        setResult(newItems);
        setSpinner(false);
    };
}());
