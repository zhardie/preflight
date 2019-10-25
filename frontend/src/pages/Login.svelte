<script>
  import { username, credentials, apiHost, apiHeaders } from '../stores.js';

  let password = '';

  async function login() {
    let url = $apiHost + '/login';
    let body = {
      'username': $username,
      'password': password
    }
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: "include",
      redirect: 'follow',
      headers: $apiHeaders,
      body: JSON.stringify(body)
    })

    const text = await res.text();

    if (res.ok) {
      credentials.update( n => true);
      username.update( n => $username);
    } else {
      M.toast({html: "Error signing in"});
    }
  }
</script>

<h2>preflight</h2>
<div class="row">
  <form on:submit|preventDefault={login} class="col s12">
    <div class="row">
      <div class="input-field col s12">
        <input bind:value={$username} id="username" type="text" class="validate">
        <label for="username">Username</label>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s12">
        <input bind:value={password} id="password" type="password" class="validate">
        <label for="password">Password</label>
      </div>
    </div>
    <button class="btn waves-effect waves-light" type="submit" name="action">sign in</button>
  </form>
</div>