// Demonstrates parallel projection views

// Global WebGL context variable
let gl;

// Buffer ids
let verts_id, colors_id;

// Global list of vertices being drawn
let verts = [];

// Location of the view uniform
let transform_loc,model_view_loc;

let last_redraw;

let theta=0;
window.addEventListener('load', function init() {
	// Get the HTML5 canvas object from it's ID
	const canvas = document.getElementById('gl-canvas');

	// Get the WebGL context (save into a global variable)
	gl = WebGLUtils.create3DContext(canvas);
	if (!gl) {
		window.alert("WebGL isn't available");
		return;
	}

	// Configure WebGL
	onResize();
	gl.clearColor(1.0, 1.0, 1.0, 0.0); // setup the background color with red, green, blue, and alpha
	gl.enable(gl.DEPTH_TEST); // things further away will be hidden

	// Compile shaders
	let vertShdr = compileShader(gl, gl.VERTEX_SHADER, `
		attribute vec4 vPosition;
		attribute vec4 vColor;
		varying vec4 fColor;
    uniform mat4 model_view;
		uniform mat4 transform;
		void main() {
			gl_Position = transform*model_view*vPosition;
      //gl_Position = transform*vPosition;

      fColor = vColor;
		}
	`);
	let fragShdr = compileShader(gl, gl.FRAGMENT_SHADER, `
		precision mediump float;
		varying vec4 fColor;
		void main() {
			gl_FragColor = fColor;
		}
	`);

	// Link the programs and use them with the WebGL context
	let program = linkProgram(gl, [vertShdr, fragShdr]);
	gl.useProgram(program);

	// Create the vertex/position buffer on the GPU but don't allocate any memory for it (do that once OBJ file is loaded)
	verts_id = gl.createBuffer(); // create a new buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, verts_id); // bind to the new buffer
	let vPosition = gl.getAttribLocation(program, 'vPosition'); // get the vertex shader attribute "vPosition"
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0); // associate the buffer with "vPosition" making sure it knows it is length-3 vectors of floats
	gl.enableVertexAttribArray(vPosition); // enable this set of data

	// Create the color buffer on the GPU but don't allocate any memory for it (do that once OBJ file is loaded)
	colors_id = gl.createBuffer(); // create a new buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, colors_id); // bind to the new buffer
	let vColor = gl.getAttribLocation(program, 'vColor'); // get the vertex shader attribute "vColor"
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0); // associate the buffer with "vColor" making sure it knows it is length-3 vectors of floats
	gl.enableVertexAttribArray(vColor); // enable this set of data

	// Load the temple asynchronously
	load_obj('cube.obj', cube_loaded);

	// Get the location of the transform uniform
	model_view_loc = gl.getUniformLocation(program, 'model_view');
	transform_loc = gl.getUniformLocation(program, "transform");

	// Listen to resize events
	window.addEventListener('resize', onResize);

	// Listen to the buttons being click


	// NOTE: Do not call render until OBJ file is loaded
});

/**
 * Once the temple file is loaded we need to get the vertices of all of its triangles and setup the
 * colors based on the normals of the vertices.
 */
function cube_loaded(pts, _, normals, inds) {
	// Setup the data from the file
	let colors = [];
	let red = vec4(1.0, 0.0, 0.0, 1.0);
	let grn = vec4(0.0, 1.0, 0.0, 1.0);
	let blu = vec4(0.0, 0.0, 1.0, 1.0);
	let org = vec4(1.0, 0.5, 0.0, 1.0);
	let ylw = vec4(1.0, 1.0, 0.0, 1.0);
	let blk = vec4(0.0, 0.0, 0.0, 1.0);
	for (let i = 0; i < inds.length; i++) {
		verts.push(pts[inds[i]]);
		let n = normals[inds[i]];
		/**
		let color = vec4(0, 0, 0, 1);
		color[0] = Math.abs(n[2]);
		color[1] = Math.abs(n[1]);
		color[2] = Math.abs(n[0]);
		**/
	colors.push(red, red, red, red, red, red);
	colors.push(grn, grn, grn, grn, grn, grn);
	colors.push(blu, blu, blu, blu, blu, blu);
	colors.push(org, org, org, org, org, org);
	colors.push(ylw, ylw, ylw, ylw, ylw, ylw);
	colors.push(blk, blk, blk, blk, blk, blk);



		//colors.push(color);
	}

	// Load the vertex and color data into the GPU
	gl.bindBuffer(gl.ARRAY_BUFFER, verts_id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, colors_id);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	// Set the default view to isometric and render the scene.
	axo_isometric();
}

/**
 * Render the scene.
 */
function render(ms) {
	// Render
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	if (ms) {
		let elapsed_ms = ms - last_redraw;
		theta += 30* elapsed_ms / 1000;
		last_redraw = ms;
	} else { last_redraw = performance.now(); }


	//let Ocube = rotateY(theta/6);



	//gl.uniformMatrix4fv(model_view_loc, false, flatten(Ocube));
	gl.uniformMatrix4fv(model_view_loc, false, flatten(rotate(theta, 1, 1, 1)));

	gl.drawArrays(gl.TRIANGLES, 0, verts.length);

	window.requestAnimationFrame(render);

}

/**
 * When we resize the window resize the canvas as well.
 */
function onResize() {
	let sz = Math.min(window.innerWidth, window.innerHeight);
	gl.canvas.width = sz;
	gl.canvas.height = sz;
	gl.viewport(0, 0, sz, sz);
}

/**
 * Update the transformation applied in the vertex shader. The scene is then rendered.
 */
function update_trans(m) {
	m = mult(scalem(0.5, 0.5, 0.5), m);
	gl.uniformMatrix4fv(transform_loc, false, flatten(m));
	render();
}

/**
 * The button functions that set the appropriate rotations.
 */
function axo_isometric() {
	update_trans(mult(rotateX(-35.264), rotateY(45)));
}
