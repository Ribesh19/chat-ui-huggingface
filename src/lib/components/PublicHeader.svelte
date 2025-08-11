<script lang="ts">
	import { base } from "$app/paths";
	import { page } from "$app/stores";
	import Logo from "$lib/components/icons/Logo.svelte";
	import { getContext } from "svelte";
	import CarbonHome from "~icons/carbon/home";
	import CarbonMachineLearningModel from "~icons/carbon/machine-learning-model";
	import CarbonBook from "~icons/carbon/book";
	import CarbonEducation from "~icons/carbon/education";
	import CarbonOverflowMenuHorizontal from "~icons/carbon/overflow-menu-horizontal";
	import CarbonChevronDown from "~icons/carbon/chevron-down";
	import CarbonIdea from "~icons/carbon/idea";
	import CarbonDocument from "~icons/carbon/document";
	import CarbonTag from "~icons/carbon/tag";
	import CarbonLocked from "~icons/carbon/locked";
	
	const publicConfig = getContext("publicConfig");
	
	let mobileMenuOpen = $state(false);
	
    let moreOpen = $state(false);
	const mainNavItems = [
		{ name: "Home", href: `${base}/home`, icon: CarbonHome },
		{ name: "AI Tutor", href: `${base}/chat`, icon: CarbonMachineLearningModel },
		{ name: "Revision", href: `${base}/revision`, icon: CarbonBook },
		{ name: "Classroom", href: `${base}/classroom`, icon: CarbonEducation },
    ];
    const moreNavItems = [
		{ name: "Features", href: `${base}/home#features`, icon: CarbonIdea },
		{ name: "How it works", href: `${base}/home#how-it-works`, icon: CarbonDocument },
		{ name: "Pricing", href: `${base}/home#pricing`, icon: CarbonTag },
		{ name: "Privacy", href: `${base}/privacy`, icon: CarbonLocked },
    ];
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<header class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm border-b border-gray-200/60 dark:border-gray-800/60">
	<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="{base}/home" class="flex items-center">
					<Logo classNames="mr-2" />
                    <span class="text-xl font-bold text-gray-900 dark:text-white">
                        Previsely
                    </span>
				</a>
			</div>

			<!-- Desktop Navigation -->
            <div class="hidden md:block">
                <div class="ml-10 flex items-baseline gap-1">
                    {#each mainNavItems as item}
						<a
							href={item.href}
                            class="px-3 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors duration-200 {$page.url.pathname === item.href.split('#')[0]
                                ? 'bg-blue-100/70 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}"
						>
                            <svelte:component this={item.icon} class="w-4 h-4" />
                            {item.name}
						</a>
                    {/each}
                    <div class="relative">
                        <button onclick={() => (moreOpen = !moreOpen)} class="px-3 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800">
                            <CarbonOverflowMenuHorizontal class="w-4 h-4" />
                            More
                            <CarbonChevronDown class="w-4 h-4" />
                        </button>
                        {#if moreOpen}
                            <div class="absolute right-0 mt-2 w-56 rounded-md border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-lg py-1 z-20">
                                {#each moreNavItems as item}
                                    <a href={item.href} onclick={() => (moreOpen = false)} class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800">
                                        <svelte:component this={item.icon} class="w-4 h-4" />
                                        {item.name}
                                    </a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <div class="ml-4 flex items-center gap-2">
                        {#if $page.data?.user}
                            <div class="hidden lg:flex items-center gap-2">
                                <span class="truncate max-w-[150px] text-sm">{$page.data.user.name || $page.data.user.email}</span>
                                <form method="POST" action="{base}/logout">
                                    <button type="submit" class="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm hover:bg-gray-100/80 dark:hover:bg-gray-800">Sign out</button>
                                </form>
                            </div>
                        {:else}
                            <a href="{base}/auth" class="hidden lg:inline-flex px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800">Sign in</a>
                            <a href="{base}/chat" class="inline-flex px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Get started</a>
                        {/if}
                    </div>
				</div>
			</div>

			<!-- Mobile menu button -->
			<div class="md:hidden">
                <button
                    onclick={toggleMobileMenu}
                    class="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    aria-expanded="false"
                >
					<span class="sr-only">Open main menu</span>
					{#if !mobileMenuOpen}
						<svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{:else}
						<svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</nav>

	<!-- Mobile menu -->
    {#if mobileMenuOpen}
        <div class="md:hidden">
            <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200/60 dark:border-gray-800/60">
                {#each mainNavItems as item}
					<a
						href={item.href}
						onclick={() => mobileMenuOpen = false}
                        class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {$page.url.pathname === item.href.split('#')[0]
                            ? 'bg-blue-100/70 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}"
					>
                        <svelte:component this={item.icon} class="w-5 h-5" />
                        {item.name}
					</a>
                {/each}
                <details class="px-1">
                    <summary class="list-none px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800 cursor-pointer inline-flex items-center gap-2">
                        <CarbonOverflowMenuHorizontal class="w-5 h-5" />
                        More
                        <CarbonChevronDown class="w-5 h-5" />
                    </summary>
                    <div class="pl-2 space-y-1 mt-1">
                        {#each moreNavItems as item}
                            <a href={item.href} onclick={() => (mobileMenuOpen = false)} class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800">
                                <svelte:component this={item.icon} class="w-5 h-5" />
                                {item.name}
                            </a>
                        {/each}
                    </div>
                </details>
                <div class="px-3 pt-2 flex items-center gap-2">
                    <a href="{base}/chat" class="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700">Get started</a>
                    <a href="{base}/auth" class="inline-flex px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800">Sign in</a>
                </div>
			</div>
		</div>
	{/if}
</header>