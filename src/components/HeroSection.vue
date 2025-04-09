<template>
    <div class="hero-container">
        <span class="badge">AI-Powered Plant Identification</span>
        <h1>Discover the <span class="underline">World of Plants</span></h1>
        <p>Identify any leaf in seconds with our powerful AI. Simply scan, learn, and connect with nature like never before.</p>
    </div>
</template>

<style scoped>
.hero-container {
    text-align: center;
    padding: 20px;
    padding-bottom: 5px;
    max-width: 400px;
    margin-bottom: 1px;
}

.badge {
    display: inline-block;
    background-color: #A1EEBD;
    color: #4c8c4a;
    font-size: 14px;
    padding: 4px 10px;
    border-radius: 12px;
    font-weight: 600;
}

h1 {
    color: #1f3b1d;
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
}

.underline {
    position: relative;
    display: inline-block;
    color: #4c8c4a;
    font-weight: 700;
}

.underline::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 8px;
    bottom: -4px;
    left: 0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='8' viewBox='0 0 100 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 4C20 0 40 8 60 4C80 0 100 8 100 4' stroke='%234c8c4a' stroke-width='2' fill='none'/%3E%3C/svg%3E") repeat-x;
    background-size: 50px 8px;
    animation: wave 2s linear infinite;
    opacity: 0.7;
}

@keyframes wave {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 50px 0;
    }
}

p {
    font-size: 16px;
    color: #4a4a4a;
}
</style>
