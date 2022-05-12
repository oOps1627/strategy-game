export function loadRedactor(): void {
    const container = document.getElementById('content');

    if (container) {
        let mouseDown = 0;
        container.onmousedown = function () {
            ++mouseDown;
        }
        container.onmouseup = function () {
            --mouseDown;
        }

        container.addEventListener('mousemove', (e) => {
            if (!mouseDown)
                return;

            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.top = e.y + 'px';
            div.style.left = e.x + 'px';
            div.style.width = '2px';
            div.style.height = '2px';
            div.style.backgroundColor = 'red';
            container.appendChild(div);
        });
    }

}

