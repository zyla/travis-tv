
function run(config) {
    var pusher = new Pusher(config.pusher.key);
    
    var runningJobs = {};
    var currentJob = null;

    var term = new Terminal({
      cols: 55,
      rows: 22
    });

    term.open(document.getElementById('term-wrapper'));

    pusher.subscribe('common');
    
    pusher.bind('job:started', function(data) {
        var id = data.id;

        console.log('Job ' + id + ' started, running jobs: ' + Object.keys(runningJobs).join(','));

        if(Object.keys(runningJobs).length < 10) {
          runningJobs[id] = true;
          if(!currentJob) {
              monitorJob(id);
          }
        }
    });

    pusher.bind('job:finished', function(data) {
        var id = data.id;

        console.log('Job ' + id + ' finished, running jobs: ' + Object.keys(runningJobs).join(','));

        delete runningJobs[id];
        if(id == currentJob) {
            currentJob = null;
            var nextJob = Object.keys(runningJobs)[0];
            if(nextJob) {
              monitorJob(nextJob);
            }
        }
    });

    pusher.bind('job:log', function(data) {
        document.getElementById('term-wrapper').className = '';

        term.write(data._log);
    });

    function monitorJob(id) {
        console.log('Monitoring job ' + id);

        currentJob = id;
        pusher.subscribe('job-' + id);
    }
}

function fetchConfig(callback) {
    doRequest('GET', 'https://api.travis-ci.org/config', function(result) {
        callback(JSON.parse(result).config);
    });
}

function doRequest(method, url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
        callback(xhr.responseText);
    };

    xhr.open(method, url, true);
    xhr.send();
}

window.onload = function() {
    fetchConfig(run);
};
