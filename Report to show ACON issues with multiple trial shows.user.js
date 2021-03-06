// ==UserScript==
// @name         Report to show ACON issues with multiple trial shows
// @namespace    http://henryscheinone.co.nz/
// @version      0.5
// @description  ugly but functional report
// @author       Alex Leonov
// @match        https://soeidental.atlassian.net/*
// @grant        none
// @license      MIT
// ==/UserScript==

/* jshint esversion: 6 */

(function() {
    'use strict';

    const b = document.createElement('button');
    document.getElementsByTagName('nav')[0].appendChild(b);
    b.innerText = 'Trial Review tickets report';

    b.onclick = function() {
        const jql = 'project=ACON AND status WAS "Ready for trial review" during (startOfMonth(-6), endOfMonth(-1)) AND NOT (summary ~ "VAP:") AND NOT (summary ~ "DI conversion")';
        
        fetch(`https://soeidental.atlassian.net/rest/api/2/search?jql=${encodeURIComponent(jql)}&expand=changelog&maxResults=100&fields=id,summary,changelog`)
        .then(response => response.json())
        .then(data => {
            const records = data.issues.map(i => {
                const histories = i.changelog.histories.filter(h => h.items.find(hi => hi.fieldId==="status" && hi.toString==="Ready for trial review"));

                if (histories.length < 1) return null;

                return {
                    key: i.key,
                    summary: i.fields.summary,
                    count: histories.length,
                    changes: histories.map(h => h.created),
                };
            })
            .filter(i => i);

            const rows = records.map(i => `<tr><td><a href='https://soeidental.atlassian.net/browse/${i.key}' target='_blank'>${i.key}</a></td><td>${i.summary}</td><td>${i.count}</td><td>${i.changes.join('<br />')}</td></tr>`).join(' ');
            const csvlines = records.map(i => `${i.key},"${i.summary}", ${i.count}, "${i.changes.join(' ')}"`).join('\n');

            document.getElementById('ghx-content-main').innerHTML = `<table cellspacing=2 cellpadding=5>${rows}</table>`;
            document.getElementById('ghx-content-main').style.overflow='scroll';
            document.getElementById('ghx-content-main').style.height='600px';

            const csvexport = document.createElement('a');
            csvexport.innerText = "Download as CSV";
            document.getElementById('ghx-content-main').insertBefore(csvexport, document.getElementById('ghx-content-main').children[0]);
            const blob = new Blob(["Key,Summary,Count,Dates\n" + csvlines]);
            const url = URL.createObjectURL(blob);
            csvexport.href = url;
            csvexport.download = "report.csv";
        });
    }
})();
