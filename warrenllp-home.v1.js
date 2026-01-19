document.addEventListener('DOMContentLoaded', function() {
  document.body.addEventListener('click', function(event) {
    if (event.target.matches('.nav-link')) {
      let elem = document.querySelector('.brand-warren-llp');
      if (elem) {
        elem.classList.add('small');
      }
    }
  });
});
