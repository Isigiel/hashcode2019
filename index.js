const jetpack = require('fs-jetpack');
const _ = require('lodash');

const inputDir = jetpack.dir('input');
const outputDir = jetpack.dir('output');

const rawIn = inputDir.read('c_memorable_moments.txt');
//const rawIn = inputDir.read('e_shiny_selfies.txt');

const lines = rawIn.split('\n');

const picData = lines.slice(1, lines.length - 1).map(line => line.split(' '));

const pics = picData.map((data, index) => {
    return {
        vertical: data[0] === 'V',
        tagNum: parseInt(data[1], 10),
        tags: data.slice(2),
        id: index
    }
});

//console.log(pics.find(pic => pic.id == 31038));

const [verticalPics, horizontalPics] = _.partition(pics, pic => pic.vertical);

const orderedVerticalPics = _.orderBy(verticalPics, ['tags'], ['asc']);

const slides = [...horizontalPics];
while (orderedVerticalPics.length > 1) {
    const currentPic = orderedVerticalPics.shift();
    let combinedTags = 0, picIndex;
    for (let i = orderedVerticalPics.length - 1; i >= 0; i--) {
        if (currentPic.tagNum + orderedVerticalPics[i].tagNum < combinedTags) {
            break;
        }
        const currentTags = new Set([...currentPic.tags, ...orderedVerticalPics[i].tags]).size;
        if (currentTags > combinedTags) {
            combinedTags = currentTags;
            picIndex = i;
        }
    }
    const partnerPic = orderedVerticalPics.splice(picIndex, 1)[0];
    const newSlide = {
        ...currentPic,
        tags: Array.from(new Set([...currentPic.tags, ...partnerPic.tags])),
        tagNum: combinedTags,
        ids: [currentPic.id, partnerPic.id]
    };
    slides.push(newSlide);
    if (orderedVerticalPics.length % 100 === 0) {
        console.log('matching slides: ', 100 - (orderedVerticalPics.length / verticalPics.length) * 100)
    }
}
console.log('Slides matched');
const slidelength = slides.length;
const workingSlides = _.orderBy(slides, ['tagNum'], ['asc']);
jetpack.write('slides.json', workingSlides);
const orderedSlides = [workingSlides.pop()];

const slideChunks = _.chunk(workingSlides, Math.round(slidelength/100));
/*slideChunks.forEach(currentSlides => {
    const chunkSlides = [...currentSlides];
    while (chunkSlides.length) {
        const currentSlide = _.last(orderedSlides);
        let score = 0, slideIndex;
        for (let i = chunkSlides.length - 1; i >= 0; i--) {
            if ((currentSlide.tagNum + chunkSlides[i].tagNum) / 4 < score) {
                break;
            }
            const currentScore = slideScore(currentSlide, chunkSlides[i]);
            if (currentScore > score) {
                score = currentScore;
                slideIndex = i;
            }
        }
        const nextSlide = chunkSlides.splice(slideIndex, 1)[0];
        orderedSlides.push(nextSlide);
        if (orderedSlides.length % 100 === 0) {
            console.log('sorting slides: ', (orderedSlides.length / slidelength) * 100)
        }
    }
});*/

const range = 8000;

while (workingSlides.length) {
    const currentSlide = _.last(orderedSlides);
    const currentIndex = workingSlides.indexOf(currentSlide);
    let score = 0, slideIndex;
    for (let i = Math.min(workingSlides.length - 1, currentIndex + range); i >= Math.max(0, currentIndex - range); i--) {
        if ((currentSlide.tagNum + workingSlides[i].tagNum) / 4 < score) {
            break;
        }
        const currentScore = slideScore(currentSlide, workingSlides[i]);
        if (currentScore > score) {
            score = currentScore;
            slideIndex = i;
        }
    }
    const nextSlide = workingSlides.splice(slideIndex, 1)[0];
    orderedSlides.push(nextSlide);
    if (orderedSlides.length % 100 === 0) {
        console.log('sorting slides: ', (orderedSlides.length / slidelength) * 100)
    }
}

const outputSlides = orderedSlides.map(slide => slide.vertical ? slide.ids.join(' ') : slide.id);
const output = `${outputSlides.length}\n${outputSlides.join('\n')}`;

jetpack.write('solution.txt', output);

function slideScoreOld(slide1, slide2) {
    const intersection = _.intersection(slide1.tags, slide2.tags);
    const only1 = _.without(slide1.tags, slide2.tags);
    const only2 = _.without(slide2.tags, slide1.tags);
    return 50-(_.max([intersection.length, only1.length, only2.length])-_.min([intersection.length, only1.length, only2.length]));
}

function slideScore(slide1, slide2) {
    const intersection = _.intersection(slide1.tags, slide2.tags);
    const only1 = _.without(slide1.tags, slide2.tags);
    const only2 = _.without(slide2.tags, slide1.tags);
    return _.min([intersection.length, only1.length, only2.length]);
}
