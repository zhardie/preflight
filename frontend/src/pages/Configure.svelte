<script>
  import { apiHost, apiHeaders } from '../stores.js';
  import { onMount } from 'svelte';
  import NewReservation from '../components/NewReservation.svelte';

  let planes = []
  let instructors = []
  let scheduled_reservations = []
  let resp

  onMount(
    async () => {
      let url = $apiHost + '/everything';
      const res = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        credentials: 'include'
      });
      const resp = await res.text();
      const r_resp = JSON.parse(resp);
      console.log(r_resp);
      planes = r_resp.planes;
      instructors = r_resp.instructors;
      scheduled_reservations = r_resp.scheduled_reservations;
    }
  )

</script>

<h2>Configure</h2>
<NewReservation instructors={instructors} planes={planes}/>
<!-- <h3>planes</h3>
{JSON.stringify(planes)}
<br>
<h3>instructors</h3>
{JSON.stringify(instructors)}
<br>
<h3>scheduled reservations</h3>
{JSON.stringify(scheduled_reservations)}
 -->