<script>
  import { username, apiHost, apiHeaders } from '../stores.js';
  import { onMount, afterUpdate } from 'svelte';
  export let instructors;
  export let planes;

  onMount(() => {
    // init date pickers
    var elems = document.querySelectorAll('.datepicker');
    var options = {
      'autoClose': true
    }
    var instances = M.Datepicker.init(elems, options);

    // init time pickers
    elems = document.querySelectorAll('.timepicker');
    options = {
      'autoClose': true
    }
    instances = M.Timepicker.init(elems, options);
  })

  afterUpdate(() => {
    // init selects
    var elems = document.querySelectorAll('select');
    var options = {}
    var instances = M.FormSelect.init(elems, options);
  });

  function getTwentyFourHourTime(amPmString) { 
    var d = new Date("1/1/2013 " + amPmString); 
    return d.getHours() + ':' + d.getMinutes(); 
  }

  function constructTimestamp(date, time) {
    var timestamp = new Date(date + ' ' + getTwentyFourHourTime(time)).getTime();
    return timestamp;
  }

  async function submitNewReservation() {
    let url = $apiHost + '/schedule_new_reservation';
    const planes_selected = document.querySelectorAll('#planes option:checked');
    const planes_values = Array.from(planes_selected).map(el => el.value);
    let begin_ts = constructTimestamp(document.getElementById('begin_date').value, document.getElementById('begin_time').value)
    let end_ts = constructTimestamp(document.getElementById('end_date').value, document.getElementById('end_time').value)
    let data = {
        'username': document.getElementById('username').value,
        'instructor': document.getElementById('instructor').value,
        'desired_planes': planes_values,
        'begin_ts': begin_ts/1000,
        'end_ts': end_ts/1000
    }

    console.log(data);

    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: "include",
      redirect: 'follow',
      headers: $apiHeaders,
      body: JSON.stringify(data)
    })

    if (res.ok) {
      M.toast({html: "Success!"})
    } else {
      M.toast({html: "Error signing in"});
    }
  }

</script>

<div class="row">
  <form on:submit|preventDefault={submitNewReservation} class="col s12">
    <div class="row">
      <div class="input-field col s6">
        <input disabled value={$username} id="username" type="text" class="validate">
        <label class="active" for="username">Member</label>
      </div>
    </div> <!-- /row -->
    <div class="row">
      <div class="input-field col s6">
        <select multiple id="planes">
          {#each planes as plane}
            <option value={plane.id}>{plane.name}</option>
          {/each}
        </select>
        <label>Aircraft</label>
      </div>
    </div> <!-- /row -->
    <div class="row">
      <div class="input-field col s6">
        <select id="instructor">
          {#each instructors as instructor}
            <option value={instructor.id}>{instructor.name}</option>
          {/each}
        </select>
        <label>Instructor</label>
      </div>
    </div> <!-- /row -->
    <div class="row">
      <div class="input-field col s6">
        <input id="begin_date" type="text" class="datepicker">
        <label class="active" for="begin_date">Begin date</label>
      </div>
      <div class="input-field col s6">
        <input id="begin_time" type="text" class="timepicker">
        <label class="active" for="begin_time">Begin time</label>
      </div>
    </div> <!-- /row -->
    <div class="row">
      <div class="input-field col s6">
        <input id="end_date" type="text" class="datepicker">
        <label class="active" for="end_date">End date</label>
      </div>
      <div class="input-field col s6">
        <input id="end_time" type="text" class="timepicker">
        <label class="active" for="end_time">End time</label>
      </div>
    </div> <!-- /row -->
    <button class="btn waves-effect waves-light" type="submit" name="action">Schedule</button>
  </form>
</div>
