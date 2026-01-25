// Linking shaders and adding to Program
function initShaderProgram(
	gl: WebGLRenderingContext,
	vsSource: string = getVertexShaderCode(),
	fsSource: string = getFragmentShaderCode()
): WebGLProgram | null {
	const vertexShader: WebGLShader | null = loadShader(
		gl,
		gl.VERTEX_SHADER,
		vsSource
	);
	const fragmentShader: WebGLShader | null = loadShader(
		gl,
		gl.FRAGMENT_SHADER,
		fsSource
	);

	if (vertexShader === null || fragmentShader === null) {
		alert("Shaders did not load :CCCCCCc");
		return null;
	}

	// Create the shader program
	const shaderProgram: WebGLProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert(
			`Unable to initialize the shader program: ${gl.getProgramInfoLog(
				shaderProgram
			)}`
		);
		return null;
	}

	return shaderProgram;
}

// Creating and compiling a shader
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader: WebGLShader | null = gl.createShader(type);
	if (shader === null) {
		alert("Could not create shader :C");
		return null;
	}

	// Send the source to the shader object
	gl.shaderSource(shader, source);

	// Compile the shader program
	gl.compileShader(shader);

	// See if it compiled successfully

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(
			`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
		);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function getVertexShaderCode() {
	const vsSource: string = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    attribute lowp float aMaterialIndex;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying lowp float vMaterialIndex;

    varying highp vec3 world_pos; // in world coords
    varying highp vec3 normal; // in world coords

    // Phong shading
    void main()
    {
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
        vMaterialIndex = aMaterialIndex;

      // Transforming position and normal to world coordinates to then pass to the fragment shader
      vec4 world_pos4d = uModelMatrix * aVertexPosition;
      world_pos = vec3(world_pos4d[0] / world_pos4d[3],world_pos4d[1] / world_pos4d[3], world_pos4d[2] / world_pos4d[3]);

      vec4 normal4d = uNormalMatrix * vec4(aVertexNormal,0);
      normal = normalize(vec3(normal4d[0], normal4d[1], normal4d[2]));
    }
  `;
	return vsSource;
}

function getFragmentShaderCode() {
	const fsSource: string = `
    uniform highp vec3 eye;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;

    struct mtlStruct {
        highp vec3 ka;
        highp vec3 kd;
        highp vec3 ks;
        highp float Ns;
        highp float d;
    };

    #define NUM_MTLS 10

    uniform mtlStruct materials[NUM_MTLS];
    varying lowp float vMaterialIndex;

    struct lightStruct {
        bool exists;
        highp vec3 position;
        highp vec3 color;
        bool is_spotlight;
        highp vec3 a;
        highp float theta;
        highp float alpha;
    };

    #define NUM_LIGHTS 10
    uniform lightStruct lights[NUM_LIGHTS];

    varying highp vec3 world_pos; // in world coords
    varying highp vec3 normal; // in world coords

    // Phong shading
    void main()
    {
        highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

        // Calculating color based on the Phong shading model
        highp vec3 E = normalize(eye - world_pos);


        highp vec3 ka;
        highp vec3 kd;
        highp vec3 ks;
        highp float Ns; 
        highp float d;
        int mtlIndex = int(floor(vMaterialIndex));
        if(mtlIndex == 0)
        {
          ka = materials[0].ka;
          kd = materials[0].kd;
          ks = materials[0].ks;
          Ns = materials[0].Ns;
          d = materials[0].d;
        }
        else
        {
          ka = materials[1].ka;
          kd = materials[1].kd;
          ks = materials[1].ks;
          Ns = materials[1].Ns;
          d = materials[1].d;
        }

        highp vec3 I = ka;
        for(int i=0; i<NUM_LIGHTS; i++)
        {
          if(!lights[i].exists)
            break;
          highp vec3 L = normalize(lights[i].position - world_pos);
          highp vec3 kdPart = kd * max(0.0, dot(L, normal));

          highp vec3 R = normalize(2.0 * dot(normal, L) * normal - L);
          highp vec3 ksPart = ks;
          if(Ns!=0.0)
            ksPart*= pow(max(0.0, dot(R,E)), Ns);
          
          // Doing Spotlight Calculations if the light is a spotlight
          highp float si = 1.0;
          if(lights[i].is_spotlight)
          {
              highp float dot_result = dot(normalize(-1.0 * L), normalize(lights[i].a));
              if( dot_result < cos(lights[i].theta))
              {
                  si = 0.0;
              }
              else
              {
                  si = pow(dot_result, lights[i].alpha);
              }
          }
          I += lights[i].color * (kdPart + ksPart) * si;
        }
        gl_FragColor = vec4(texelColor.rgb * I, texelColor.a*d);
    }
  `;
	return fsSource;
}

export { initShaderProgram };
