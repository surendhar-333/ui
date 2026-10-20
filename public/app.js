(() => {
  const form = document.querySelector('#load-form');
  const byId = id => document.getElementById(id);
  const applicationOptions = byId('application-options');
  const details = byId('stream-details');
  const reviewPanel = byId('review-panel');
  const jobPanel = byId('job-panel');
  const resultPanel = byId('result-panel');
  const logsPanel = byId('logs-panel');
  const streamSelect = form.elements.stream;

  const demoOptions = {
    SPS: ['SPS_DAILY_01', 'SPS_DAILY_02'],
    FSAMS: ['FSAMS_DAILY_01', 'FSAMS_DAILY_02'],
  };
  const steps = ['Validate request', 'Find archive', 'Transfer file', 'Prepare load', 'Load database', 'Verify stream'];
  const stepMessages = [
    'Request validated. Destination and stream accepted.',
    'Demo archive history matched. Sample file located.',
    'Demo file transfer complete. Integrity check passed.',
    'Demo load prerequisites complete.',
    'Demo database load step completed.',
    'Demo stream status verified: LOADED.',
  ];

  let request = {};
  let timer = null;
  let stepIndex = 0;
  let logLines = [];
  let requestNumber = 1042;

  const today = new Date();
  byId('current-date').value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const stageList = byId('stage-list');
  steps.forEach((name, index) => {
    const item = document.createElement('li');
    item.dataset.state = 'pending';
    item.innerHTML = '<span class="stage-dot">' + (index + 1) + '</span><span class="stage-name"></span><span class="stage-state">Pending</span>';
    item.querySelector('.stage-name').textContent = name;
    stageList.append(item);
  });

  function refreshChoices() {
    const environment = form.elements.environment.value;
    const application = form.elements.application.value;
    applicationOptions.disabled = !environment;
    details.disabled = !application;
    byId('review-button').disabled = !application;

    const selected = streamSelect.value;
    streamSelect.replaceChildren(new Option('Select a stream', ''));
    (demoOptions[application] || []).forEach(stream => streamSelect.add(new Option(stream, stream)));
    if (Array.from(streamSelect.options).some(option => option.value === selected)) {
      streamSelect.value = selected;
    }
  }

  form.addEventListener('change', event => {
    if (event.target.name === 'environment') {
      form.querySelectorAll('[name="application"]').forEach(input => { input.checked = false; });
      streamSelect.value = '';
      form.elements.platform.value = '';
      form.elements.cut.value = '';
    }
    if (event.target.name === 'application') {
      streamSelect.value = '';
      form.elements.platform.value = '';
      form.elements.cut.value = '';
    }
    refreshChoices();
  });

  function renderSummary(target, entries) {
    target.replaceChildren();
    entries.forEach(([label, value]) => {
      const item = document.createElement('dl');
      item.className = 'summary-item';
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      item.append(term, description);
      target.append(item);
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    request = Object.fromEntries(new FormData(form));
    renderSummary(byId('review-summary'), [
      ['Environment', request.environment],
      ['Application', request.application],
      ['Stream name', request.stream],
      ['Platform', request.platform],
      ['Cut', request.cut],
      ['Work-of date', request.date],
    ]);
    byId('target-notice').textContent = 'This request retrieves the production archive and loads ' + request.stream + ' into ' + request.environment + '.';
    form.hidden = true;
    reviewPanel.hidden = false;
    byId('page-title').textContent = 'Review your load';
    byId('page-description').textContent = 'Check the destination and stream before starting.';
  });

  byId('edit-button').addEventListener('click', () => {
    reviewPanel.hidden = true;
    form.hidden = false;
    byId('page-title').textContent = 'New stream load';
    byId('page-description').textContent = 'Choose a destination and application to get started.';
  });

  function addLog(message) {
    const elapsed = String(logLines.length * 2).padStart(2, '0');
    logLines.push('[DEMO +' + elapsed + 's] ' + message);
    byId('log-output').textContent = logLines.join('\n');
    byId('log-output').scrollTop = byId('log-output').scrollHeight;
  }

  function updateLogsVisibility() {
    logsPanel.hidden = !byId('show-logs').checked;
  }

  byId('show-logs').addEventListener('change', updateLogsVisibility);

  function renderProgress() {
    const complete = stepIndex >= steps.length;
    byId('current-step').textContent = complete ? 'All loading stages complete' : 'Step ' + (stepIndex + 1) + ': ' + steps[stepIndex];
    byId('progress-caption').textContent = stepIndex + ' of ' + steps.length + ' stages complete';
    byId('progress-track').setAttribute('aria-valuenow', String(stepIndex));
    byId('progress-fill').style.width = (stepIndex / steps.length) * 100 + '%';

    Array.from(stageList.children).forEach((item, index) => {
      const state = index < stepIndex ? 'done' : index === stepIndex && !complete ? 'active' : 'pending';
      item.dataset.state = state;
      item.querySelector('.stage-dot').textContent = state === 'done' ? '✓' : String(index + 1);
      item.querySelector('.stage-state').textContent = state === 'done' ? 'Complete' : state === 'active' ? 'In progress' : 'Pending';
    });

    if (!complete) return;

    byId('job-status').textContent = 'COMPLETE';
    byId('job-status').className = 'status-pill status-complete';
    byId('result-panel').dataset.failed = 'false';
    byId('result-title').textContent = 'Stream loaded successfully';
    byId('stream-status').textContent = 'LOADED';
    const loadDate = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    renderSummary(byId('result-summary'), [
      ['Load identifier', 'DEMO-LD-' + loadDate + '-' + String(requestNumber).padStart(4, '0')],
      ['Stream', request.stream],
      ['Environment', request.environment],
      ['Application', request.application],
      ['Work-of date', request.date],
      ['Stream status', 'LOADED'],
    ]);
    byId('result-note').textContent = 'Demo result for ' + request.environment + '; no database was changed.';
    resultPanel.hidden = false;
    byId('log-state').textContent = 'Demo log capture finished';
  }

  function advanceDemo() {
    if (stepIndex >= steps.length) return;
    addLog(stepMessages[stepIndex]);
    stepIndex += 1;
    renderProgress();
    if (stepIndex < steps.length) timer = setTimeout(advanceDemo, 2000);
  }

  byId('start-button').addEventListener('click', () => {
    reviewPanel.hidden = true;
    jobPanel.hidden = false;
    resultPanel.hidden = true;
    byId('page-title').textContent = 'Load activity';
    byId('page-description').textContent = 'Follow each stage from archive lookup to stream verification.';
    byId('job-meta').replaceChildren();
    [request.environment, request.application, request.stream, 'Cut ' + request.cut, request.date].forEach(value => {
      const item = document.createElement('span');
      item.textContent = value;
      byId('job-meta').append(item);
    });
    byId('request-id').textContent = 'Demo request ' + requestNumber;
    byId('show-logs').checked = byId('logs-on-start').checked;
    updateLogsVisibility();
    byId('job-status').textContent = 'RUNNING';
    byId('job-status').className = 'status-pill status-running';
    byId('log-state').textContent = 'Updating during demo';
    stepIndex = 0;
    logLines = [];
    byId('log-output').textContent = '';
    addLog('Demo request accepted for ' + request.environment + ' / ' + request.application + '.');
    renderProgress();
    timer = setTimeout(advanceDemo, 1200);
  });

  byId('new-load-button').addEventListener('click', () => {
    clearTimeout(timer);
    requestNumber += 1;
    jobPanel.hidden = true;
    form.hidden = false;
    byId('page-title').textContent = 'New stream load';
    byId('page-description').textContent = 'Choose a destination and application to get started.';
  });

  refreshChoices();
})();
