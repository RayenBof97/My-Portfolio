/*===== MENU SHOW =====*/ 
const showMenu = (toggleId, navId) =>{
    const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId)
    if(toggle && nav){
        toggle.addEventListener('click', ()=>{
            nav.classList.toggle('show')
        })
    }
}
showMenu('nav-toggle','nav-menu')
/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')
function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show')
}
navLink.forEach(n => n.addEventListener('click', linkAction))
/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')
const scrollActive = () =>{
    const scrollDown = window.scrollY
  sections.forEach(current =>{
        const sectionHeight = current.offsetHeight,
              sectionTop = current.offsetTop - 58,
              sectionId = current.getAttribute('id'),
              sectionsClass = document.querySelector('.nav__menu a[href*=' + sectionId + ']')
        if(!sectionsClass) return
        if(scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight){
            sectionsClass.classList.add('active-link')
        }else{
            sectionsClass.classList.remove('active-link')
        }                                                    
    })
}
window.addEventListener('scroll', scrollActive)
/*===== HEADER SHADOW ON SCROLL (subtle dynamic touch) =====*/
const header = document.querySelector('.l-header')
const headerShadow = () => {
    if(!header) return
    header.style.boxShadow = window.scrollY > 20
        ? '0 4px 16px rgba(14, 36, 49, 0.15)'
        : '0 1px 4px rgba(146, 161, 176, 0.15)'
}
window.addEventListener('scroll', headerShadow)
headerShadow()
/*===== SCROLL REVEAL ANIMATION =====*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2000,
    delay: 200,
//     reset: true
});
// Function to open the lightbox
function openLightbox(imgElement) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    lightboxImg.src = imgElement.src;
    lightbox.classList.add("show"); // Add show class to make it visible
}
// Function to close the lightbox
function closeLightbox() {
    document.getElementById("lightbox").classList.remove("show"); // Remove show class to hide it
}
// Ensure lightbox is hidden on page load
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("lightbox").classList.remove("show");
});
// Close lightbox on background click or Escape key (small UX polish)
document.getElementById("lightbox")?.addEventListener("click", function(e){
    if(e.target.id === "lightbox") closeLightbox()
});
document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeLightbox()
});

sr.reveal('.home__data, .about__img, .skills__subtitle, .skills__text , .skills__category-title , .experience__description , .experience__logo ,.projects__item',{}); 
sr.reveal('.home__img, .about__subtitle, .about__text, .skills__img ,.skills__icons ,.experience__images , .contact__card',{delay: 400}); 
sr.reveal('.home__social-icon',{ interval: 200}); 
sr.reveal('.skills__data, .work__img, .contact__input',{interval: 200}); 
