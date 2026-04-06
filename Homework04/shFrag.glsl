#version 300 es

precision mediump float;
uniform vec4 v_color;
out vec4 fragColor;

void main() {
    fragColor = v_color;
} 