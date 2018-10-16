/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{   
    // Check if an element is inside the viewport.
    // from https://codepen.io/bfintal/pen/Ejvgrp.
    const inViewport = (el) => {
        const scroll = window.scrollY || window.pageYOffset
        const boundsTop = el.getBoundingClientRect().top + scroll

        const viewport = {
            top: scroll,
            bottom: scroll + winsize.height
        }

        const bounds = {
            top: boundsTop,
            bottom: boundsTop + el.clientHeight
        }

        return (
            ( bounds.bottom >= viewport.top && bounds.bottom <= viewport.bottom ) || 
            ( bounds.top <= viewport.bottom && bounds.top >= viewport.top )
        );
    };

    // Generates a random number.
    const randNumber = (min,max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Line equation.
    const lineEq = (y2, y1, x2, x1, currentVal) => {
        // y = mx + b 
        var m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
        return m * currentVal + b;
    };

    // The grid item obj.
    class GridItem {
        constructor(el) {
            this.DOM = {el: el};
            // Image wrap.
            this.DOM.wrap = this.DOM.el.querySelector('.grid__item-wrap');
            // Item´s title and year.
            this.DOM.title = this.DOM.el.querySelector('.grid__item-title');
            this.DOM.year = this.DOM.el.querySelector('.grid__item-year');
            // Get the size and position of both the main item and the wrap elements.
            this.calcDimentions();
            this.initEvents();
        }
        calcDimentions() {
            this.rects = {
                el: this.DOM.el.getBoundingClientRect(),
                wrap: this.DOM.wrap.getBoundingClientRect()
            };
        }
        initEvents() {
            this.layoutFn = () => this.calcDimentions();
            window.addEventListener('resize', () => this.layoutFn());
        }
    }

    // The grid obj.
    class GridFx {
        constructor(el) {
            this.DOM = {el: el};
            // The grid items instances.
            this.items = [];
            Array.from(this.DOM.el.querySelectorAll('.grid__item')).forEach(item => this.items.push(new GridItem(item)));
             // The nav link that will trigger the loop effect.
            this.DOM.showPhotosCtrl = document.querySelector('nav.menu > .menu__item[href="#content-photography"]');
            // The content elements.
            this.DOM.content = {
                main: document.querySelector('.content--main'),
                photography: document.querySelector('.content--photography'),
                category: document.querySelector('.category'),
                backCtrl: document.querySelector('.backbutton'),
                home: document.querySelector('h2.title')
            };
            // Bind events.
            this.initEvents();
        }
        initEvents() {
            // Mouse events for the "photography" link.

            // Mouseenter: Start looping through the photos that are inside the viewport.
            // We only loop through these so that we can see the whole animation (photo scaling down to its grid position)
            this.DOM.showPhotosCtrl.addEventListener('mouseenter', () => {
                clearTimeout(this.mousetime);
                this.currentItem = null;
                this.mousetime = setTimeout(() => this.loopThroughPhotos(), 40);
            });
            // Mouseleave: stop the photo looping animation.
            this.DOM.showPhotosCtrl.addEventListener('mouseleave', () => {
                clearTimeout(this.mousetime);
                this.stopLoop();
            });
            // Click: stop the loop and show the grid. 
            this.DOM.showPhotosCtrl.addEventListener('click', (ev) => {
                ev.preventDefault();
                this.DOM.showPhotosCtrl.classList.add('menu__item--current');
                this.showGrid();
            });

            // Back from grid.
            this.backFn = () => {
                this.DOM.showPhotosCtrl.classList.remove('menu__item--current');
                if ( this.isGridVisible ) {
                    this.hideGrid();
                }
            };
            this.DOM.content.backCtrl.addEventListener('click', () => this.backFn());
            this.DOM.content.home.addEventListener('click', (ev) => {
                ev.preventDefault();
                this.backFn();
            });
        }
        // Looping the grid photos.
        loopThroughPhotos() {
            if ( this.isGridVisible ) return;
            const loopInterval = 350;
            // Hide main content and show grid content.
            this.toggleContent();
            // Get the items that are in the viewport.
            // Also, set the transform so that the photos are centered.
            let inViewportItems = [];
            for (let item of this.items) {
                if ( inViewport(item.DOM.wrap) ) {
                    item.calcDimentions();
                    const itemRect = item.rects.wrap;
                    const ratioWrap = itemRect.height/itemRect.width;
                    const ratioWindow = winsize.height/winsize.width;
                    const scaleVal = ratioWrap > ratioWindow ? winsize.width/itemRect.width : (winsize.height)/itemRect.height;
                    TweenMax.set(item.DOM.wrap, {
                        x: winsize.width/2 - (itemRect.left+itemRect.width/2),
                        y: winsize.height/2 - (itemRect.top+itemRect.height/2),
                        scale: scaleVal
                    });
                    inViewportItems.push(item);
                }
            }
            
            if ( inViewportItems.length > 1 ) {
                let oldpos = -1;
                const loop = (pos = 0) => {
                    // Cache the previous item.
                    if ( oldpos >= 0 ) {
                        const oldel = inViewportItems[oldpos];
                        // Reset.
                        TweenMax.set(oldel.DOM.wrap, {
                            opacity: 0,
                            zIndex: 1
                        });
                    }
                    this.currentItem = inViewportItems[pos];
                    // Fade in current visible item for the first iteration in the loop.
                    if ( oldpos === -1 ) {
                        TweenMax.set(this.currentItem.DOM.wrap, {zIndex: 998});
                        TweenMax.to(this.currentItem.DOM.wrap, 0.2, {opacity: 1});
                    }
                    else {
                        TweenMax.set(this.currentItem.DOM.wrap, {opacity: 1, zIndex: 998});
                    }
                    oldpos = pos;
                    pos = pos < inViewportItems.length-1 ? pos+1 : 0;
                    this.looptimeout = setTimeout(() => loop(pos), loopInterval);
                };
                loop();
            }
        }
        stopLoop() {
            if ( this.isGridVisible ) return;
            // Hide grid content and show main content.
            this.toggleContent(false);
            // Stop the loop.
            clearTimeout(this.looptimeout);

            for (let item of this.items) {
                if ( item == this.currentItem ) {
                    // Fade out current visible item.
                    TweenMax.to(item.DOM.wrap, 0.2, {
                        opacity: 0,
                        // Reset.
                        onComplete: () => TweenMax.set(item.DOM.wrap, {x: 0,y: 0,scale: 1})
                    });
                }
                else {
                    // Reset.
                    TweenMax.set(item.DOM.wrap, {opacity: 0,x: 0,y: 0,scale: 1});
                }
            }
        }
        showGrid() {
            if ( this.isGridVisible ) return;
            this.isGridVisible = true;
            clearTimeout(this.looptimeout);
             // Hide main content and show grid content.
            this.toggleContent();
            
            // Calculate if the current item is on the left or right side. This will determine the movement for the other items.
            let side = 'left';
            if ( this.currentItem ) {
                const itemRect = this.currentItem.rects.el;
                // Check if the item is on the left or right side of the viewport. This will determine the direction for the animations of the grid items.
                side = itemRect.left+itemRect.width/2 < winsize.width/2 ? 'left' : 'right';
            }

            for (let item of this.items) {
                let duration;
                let ease = new Ease(BezierEasing(0.2,1,0.3,1));

                // Scale down to its grid position.
                if ( this.currentItem == item ) {
                    duration = .8;
                    // Animate the current visible item to its grid position.
                    TweenMax.to(item.DOM.wrap, duration, {
                        ease: ease,
                        x: 0,
                        y: 0,
                        scale: 1,
                        onComplete: () => TweenMax.set(item.DOM.wrap, {zIndex: 1})
                    });
                }
                else { 
                    // Animate all the other grid items.
                    // The duration and initial positions will depend on the distance from their center to the boundaries of the viewport.
                    const itemRect = item.rects.el;
                    duration = lineEq(side === 'right' ? 7 : 14,side === 'right' ? 14 : 7,winsize.width,0,itemRect.left+itemRect.width/2)/10;
                    TweenMax.to(item.DOM.wrap, duration, {
                        ease: ease,
                        startAt: {
                            x: (side === 'left' ? 1 : -1)*(lineEq(side === 'right' ? 100 : winsize.width,side === 'right' ? winsize.width : 100,winsize.width,0,itemRect.left+itemRect.width/2)),
                            y: itemRect.top+itemRect.height/2 < winsize.height/2 ? randNumber(-400,-200) : randNumber(200,400), 
                            scale: 1, 
                            opacity: 1
                        },
                        x: 0,
                        y: 0,
                        opacity: 1
                    });
                }

                // Animate title and year.
                TweenMax.to(item.DOM.title, duration, {
                    ease: ease,
                    startAt: {x: side === 'left' ? 500 : -500, opacity: 0},
                    x: 0,
                    opacity: 1
                });
                TweenMax.to(item.DOM.year, duration, {
                    ease: ease,
                    startAt: {x: side === 'left' ? 100 : -100, opacity: 0},
                    x: 0,
                    opacity: 1
                });
            };

            // Animate the left panel (categories) in.
            TweenMax.to(this.DOM.content.category, 1, {
                ease: new Ease(BezierEasing(0.2,1,0.3,1)),
                startAt: {x: -50, opacity: 0},
                x: 0,
                opacity: 1
            });
        }
        hideGrid() {
            const duration = 0.5;
            const ease = new Ease(BezierEasing(0.2,1,0.3,1));
            
            // Animate the left panel (categories) out.
            TweenMax.to(this.DOM.content.category, duration, {
                ease: ease,
                x: -50,
                opacity: 0
            });
            // Animate the grid items out.
            for (let item of this.items) {
                TweenMax.to([item.DOM.wrap,item.DOM.title,item.DOM.year], duration, {
                    ease: ease,
                    x: -50,
                    opacity: 0,
                    // Reset transform.
                    onComplete: () => TweenMax.set(item.DOM.wrap, {x:0})
                });
            }
            // Show main/home.
            TweenMax.to(this.DOM.content.main, duration, {
                ease: ease,
                startAt: {x: 50, opacity: 0},
                x: 0,
                opacity: 1,
                // Hide grid content and show main content.
                onComplete: () => {
                    this.isGridVisible = false;
                    this.toggleContent(false);
                }
            });
        }
        toggleContent(isGrid = true) {
            TweenMax.set(this.DOM.content.main, {opacity: isGrid ? 0 : 1});
            this.DOM.content.main.classList[isGrid ? 'remove' : 'add']('content--current');
            this.DOM.content.photography.classList[isGrid ? 'add' : 'remove']('content--current');
        }
    }

    // Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);

    // Initialize the grid instance.
    new GridFx(document.querySelector('.grid'));
    
    // Preload all the images in the page..
    imagesLoaded(document.querySelectorAll('.grid__item-img'), {background: true}, () => document.body.classList.remove('loading'));
}

