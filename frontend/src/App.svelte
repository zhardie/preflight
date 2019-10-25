<script>
  import Router from 'svelte-spa-router';
  import Login from './pages/Login.svelte';
  import Configure from './pages/Configure.svelte';
  import Notfound from './pages/Notfound.svelte';
  import { credentials } from './stores.js';

  const routes = {
    '/': Configure,
    '*': Notfound
  }

</script>

{#if $credentials == false}
  <Login />
{:else}
  <Router {routes}/>
{/if}
