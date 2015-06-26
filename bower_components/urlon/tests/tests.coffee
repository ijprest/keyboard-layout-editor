
beforeEach ->
	@addMatchers
		toBeWorking: (obj) ->
			one = URLON.stringify obj
			two = URLON.parse one
			three = URLON.stringify two

			if one isnt three
				console.log obj
				console.log one
				console.log two
				console.log three

			one is three

describe "URLON", ->
	test = (obj) ->
		name = (JSON.stringify obj) || "undefined"
		if name.length > 100
			name = name[0...97] + '...'
		it name, ->
			expect().toBeWorking obj

	describe "Booleans", ->
		test true
		test false
		test null
		test undefined

	describe "Numbers", ->
		test 1234567890
		test 0.123456789e-12
		test -9876.543210
		test 23456789012e66
		test 0
		test 1
		test 0.5
		test 98.6
		test 99.44
		test 1066
		test 1e1
		test 0.1e1
		test 1e-1
		test 1e00
		test 2e+00
		test 2e-00
		test -42

	describe "Strings", ->
		test ""
		test ";"
		test "@"
		test "/"
		test "|"
		test "&"
		test " "
		test "\""
		test "\\"
		test "\b\f\n\r\t"
		test "/ & \/"
		test "abcdefghijklmnopqrstuvwyz"
		test "ABCDEFGHIJKLMNOPQRSTUVWYZ"
		test "0123456789"
		test "`1~!@#$%^&*()_+-={':[,]}|;.</>?"
		test "\u0123\u4567\u89AB\uCDEF\uabcd\uef4A"
		test "// /* <!-- --"
		test "# -- --> */"
		test "@:0&@:0&@:0&:0"
		test "{\"object with 1 member\":[\"array with 1 element\"]}"
		test "&#34; \u0022 %22 0x22 034 &#x22;"
		test "\/\\\"\uCAFE\uBABE\uAB98\uFCDE\ubcda\uef4A\b\f\n\r\t`1~!@#$%^&*()_+-=[]{}|;:',./<>?"


	describe "Array", ->
		test []
		test [[0]]
		test [[[[[0]]]]]
		test [[[[[0],0]],0]]
		test [0, [0, [0, 0]]]

	describe "Object", ->
		test {}
		test {"": ""}
		test {"a": {"b": 1}, "c": "x"}

	describe "Complex", ->
		test [ {}, {} ]

		test {
				foo : [ 2, {
					bar : [ 4, {
						baz : [ 6, {
							"deep enough" : 7
						}]
					}]
				}]
			}

		test {
				num: 1,
				alpha: "abc",
				ignore: "me",
				change: "to a function",
				toUpper: true,
				obj: {
					nested_num: 50,
					undef: undefined,
					alpha: "abc"
				},
				arr: [1, 7, 2]
			}

		test [ "JSON Test Pattern pass1", {"object with 1 member":["array with 1 element"]}, {}, [], -42, true, false, null, { "integer": 1234567890, "real": -9876.543210, "e": 0.123456789e-12, "E": 1.234567890e+34, "": 23456789012e66, "zero": 0, "one": 1, "space": " ", "quote": "\"", "backslash": "\\", "controls": "\b\f\n\r\t", "slash": "/ & \/", "alpha": "abcdefghijklmnopqrstuvwyz", "ALPHA": "ABCDEFGHIJKLMNOPQRSTUVWYZ", "digit": "0123456789", "0123456789": "digit", "special": "`1~!@#$%^&*()_+-={':[,]}|;.</>?", "hex": "\u0123\u4567\u89AB\uCDEF\uabcd\uef4A", "true": true, "false": false, "null": null, "array":[ ], "object":{ }, "address": "50 St. James Street", "url": "http://www.JSON.org/", "comment": "// /* <!-- --", "# -- --> */": " ", " s p a c e d " :[1,2 , 3 , 4 , 5 , 6 ,7 ],"compact":[1,2,3,4,5,6,7], "jsontext": "{\"object with 1 member\":[\"array with 1 element\"]}", "quotes": "&#34; \u0022 %22 0x22 034 &#x22;", "\/\\\"\uCAFE\uBABE\uAB98\uFCDE\ubcda\uef4A\b\f\n\r\t`1~!@#$%^&*()_+-=[]{}|;:',./<>?" : "A key can be any string" }, 0.5 ,98.6 , 99.44 , 1066, 1e1, 0.1e1, 1e-1, 1e00,2e+00,2e-00 ,"rosebud"]

		test {"type":"Node","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":30,"dy":415},"children":[],"fillStyle":"#0089ff","text":"Created with Zwibbler.com","fontName":"Arial","fontSize":12},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":467,"dy":23},"children":[],"fillStyle":"#000000","text":"is processed","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":419,"dy":1},"children":[],"fillStyle":"#000000","text":"After the empty object","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":248,"dy":24},"children":[],"fillStyle":"#000000","text":"is processed","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":243,"dy":1},"children":[],"fillStyle":"#000000","text":"After a Rect","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":30,"dy":28},"children":[],"fillStyle":"#000000","text":"is processed","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":25,"dy":5},"children":[],"fillStyle":"#000000","text":"After a Point","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":33,"dy":358},"children":[],"fillStyle":"#000000","text":"object.","fontName":"FG Virgil","fontSize":15},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":32,"dy":341},"children":[],"fillStyle":"#000000","text":"the path to a completed","fontName":"FG Virgil","fontSize":15},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":32,"dy":323},"children":[],"fillStyle":"#000000","text":"Gray nodes represent","fontName":"FG Virgil","fontSize":15},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":504,"dy":375},"children":[],"fillStyle":"#000000","text":"height","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":487,"dy":295},"children":[],"fillStyle":"#000000","text":"width","fontName":"FG Virgil","fontSize":20},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":296,"dy":-5},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":246,"startY":273,"closed":false,"segments":[{"type":2,"x":231,"y":296}],"shadow":false}},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":-1.0052223548588493,"m12":0,"m21":0,"m22":0.9694181823431851,"dx":616.8428551273748,"dy":154.213227992421},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":103,"startY":192,"closed":false,"segments":[{"type":2,"x":89,"y":225}],"shadow":false}},{"type":"PathNode","matrix":{"m11":-0.6630394213564543,"m12":0,"m21":0,"m22":0.5236476835782672,"dx":565.5201948628471,"dy":371.5686591257294},"children":[],"strokeStyle":"#000000","fillStyle":"#e1e1e1","lineWidth":4,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"PathNode","matrix":{"m11":-1.475090930376591,"m12":0,"m21":0,"m22":1.2306765694828008,"dx":700.1381032855618,"dy":133.20628077515605},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":126.25,"startY":127.50445838342671,"closed":true,"segments":[{"type":3,"x":146.01190476190476,"y":147.5936260519611,"x1":146.01190476190476,"y1":127.50445838342671,"r":[-0.1750196823850274,-0.05804965365678072,-0.3536788672208786,0.053223272785544395]},{"type":3,"x":126.25,"y":167.6827937204955,"x1":146.01190476190476,"y1":167.6827937204955,"r":[-0.32906053867191076,-0.11536165233701468,0.35579121299088,0.38731588050723076]},{"type":3,"x":108,"y":147,"x1":106.48809523809524,"y1":167.6827937204955,"r":[0.08825046103447676,0.011088204570114613,0.43411328736692667,-0.1330692209303379]},{"type":3,"x":126.25,"y":127.50445838342671,"x1":106.48809523809524,"y1":127.50445838342671,"r":[0.42778260353952646,0.24726040940731764,0.3631806019693613,0.05325550492852926]}],"shadow":false},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":543,"dy":225},"children":[],"fillStyle":"#000000","text":"Y","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":559,"dy":144},"children":[],"fillStyle":"#000000","text":"x","fontName":"FG Virgil","fontSize":20},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":464,"dy":-3},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":103,"startY":192,"closed":false,"segments":[{"type":2,"x":89,"y":225}],"shadow":false}},{"type":"PathNode","matrix":{"m11":0.4841400176012311,"m12":0,"m21":0,"m22":0.48095238095238096,"dx":526.2705783334583,"dy":222.70238095238096},"children":[],"strokeStyle":"#000000","fillStyle":"#e1e1e1","lineWidth":4,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":464,"dy":-3},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":76,"startY":111,"closed":false,"segments":[{"type":2,"x":92,"y":143}],"shadow":false}},{"type":"PathNode","matrix":{"m11":1.3368391918073623,"m12":0,"m21":0,"m22":1.3058369941348298,"dx":397.4634652643233,"dy":-29.230987805439646},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":126.25,"startY":127.50445838342671,"closed":true,"segments":[{"type":3,"x":146.01190476190476,"y":147.5936260519611,"x1":146.01190476190476,"y1":127.50445838342671,"r":[-0.1750196823850274,-0.05804965365678072,-0.3536788672208786,0.053223272785544395]},{"type":3,"x":126.25,"y":167.6827937204955,"x1":146.01190476190476,"y1":167.6827937204955,"r":[-0.32906053867191076,-0.11536165233701468,0.35579121299088,0.38731588050723076]},{"type":3,"x":108,"y":147,"x1":106.48809523809524,"y1":167.6827937204955,"r":[0.08825046103447676,0.011088204570114613,0.43411328736692667,-0.1330692209303379]},{"type":3,"x":126.25,"y":127.50445838342671,"x1":106.48809523809524,"y1":127.50445838342671,"r":[0.42778260353952646,0.24726040940731764,0.3631806019693613,0.05325550492852926]}],"shadow":false},{"type":"PathNode","matrix":{"m11":0.4841400176012311,"m12":0,"m21":0,"m22":0.48095238095238096,"dx":505.2705783334583,"dy":61.70238095238095},"children":[],"strokeStyle":"#000000","fillStyle":"#e1e1e1","lineWidth":4,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":290,"dy":373},"children":[],"fillStyle":"#000000","text":"height","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":273,"dy":293},"children":[],"fillStyle":"#000000","text":"width","fontName":"FG Virgil","fontSize":20},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":82,"dy":-7},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":246,"startY":273,"closed":false,"segments":[{"type":2,"x":231,"y":296}],"shadow":false}},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":-1.0052223548588493,"m12":0,"m21":0,"m22":0.9694181823431851,"dx":402.8428551273748,"dy":152.213227992421},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":103,"startY":192,"closed":false,"segments":[{"type":2,"x":89,"y":225}],"shadow":false}},{"type":"PathNode","matrix":{"m11":-0.6630394213564543,"m12":0,"m21":0,"m22":0.5236476835782672,"dx":351.52019486284706,"dy":369.5686591257294},"children":[],"strokeStyle":"#000000","fillStyle":"#e1e1e1","lineWidth":4,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"PathNode","matrix":{"m11":-1.4512941300747246,"m12":0,"m21":0,"m22":1.2306765694828008,"dx":483.6192163567064,"dy":131.20628077515607},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":126.25,"startY":127.50445838342671,"closed":true,"segments":[{"type":3,"x":146.01190476190476,"y":147.5936260519611,"x1":146.01190476190476,"y1":127.50445838342671,"r":[-0.1750196823850274,-0.05804965365678072,-0.3536788672208786,0.053223272785544395]},{"type":3,"x":126.25,"y":167.6827937204955,"x1":146.01190476190476,"y1":167.6827937204955,"r":[-0.32906053867191076,-0.11536165233701468,0.35579121299088,0.38731588050723076]},{"type":3,"x":108,"y":147,"x1":106.48809523809524,"y1":167.6827937204955,"r":[0.08825046103447676,0.011088204570114613,0.43411328736692667,-0.1330692209303379]},{"type":3,"x":126.25,"y":127.50445838342671,"x1":106.48809523809524,"y1":127.50445838342671,"r":[0.42778260353952646,0.24726040940731764,0.3631806019693613,0.05325550492852926]}],"shadow":false},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":329,"dy":223},"children":[],"fillStyle":"#000000","text":"Y","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":345,"dy":142},"children":[],"fillStyle":"#000000","text":"x","fontName":"FG Virgil","fontSize":20},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":250,"dy":-5},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":103,"startY":192,"closed":false,"segments":[{"type":2,"x":89,"y":225}],"shadow":false}},{"type":"PathNode","matrix":{"m11":0.4841400176012311,"m12":0,"m21":0,"m22":0.48095238095238096,"dx":312.2705783334583,"dy":220.70238095238096},"children":[],"strokeStyle":"#000000","fillStyle":"#e1e1e1","lineWidth":4,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":250,"dy":-5},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":76,"startY":111,"closed":false,"segments":[{"type":2,"x":92,"y":143}],"shadow":false}},{"type":"PathNode","matrix":{"m11":1.3368391918073623,"m12":0,"m21":0,"m22":1.3058369941348298,"dx":183.46346526432328,"dy":-31.230987805439646},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":126.25,"startY":127.50445838342671,"closed":true,"segments":[{"type":3,"x":146.01190476190476,"y":147.5936260519611,"x1":146.01190476190476,"y1":127.50445838342671,"r":[-0.1750196823850274,-0.05804965365678072,-0.3536788672208786,0.053223272785544395]},{"type":3,"x":126.25,"y":167.6827937204955,"x1":146.01190476190476,"y1":167.6827937204955,"r":[-0.32906053867191076,-0.11536165233701468,0.35579121299088,0.38731588050723076]},{"type":3,"x":108,"y":147,"x1":106.48809523809524,"y1":167.6827937204955,"r":[0.08825046103447676,0.011088204570114613,0.43411328736692667,-0.1330692209303379]},{"type":3,"x":126.25,"y":127.50445838342671,"x1":106.48809523809524,"y1":127.50445838342671,"r":[0.42778260353952646,0.24726040940731764,0.3631806019693613,0.05325550492852926]}],"shadow":false},{"type":"PathNode","matrix":{"m11":0.4841400176012311,"m12":0,"m21":0,"m22":0.48095238095238096,"dx":291.2705783334583,"dy":59.70238095238095},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":96,"dy":228},"children":[],"fillStyle":"#000000","text":"Y","fontName":"FG Virgil","fontSize":20},{"type":"TextNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":112,"dy":147},"children":[],"fillStyle":"#000000","text":"x","fontName":"FG Virgil","fontSize":20},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":17,"dy":0},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":103,"startY":192,"closed":false,"segments":[{"type":2,"x":89,"y":225}],"shadow":false}},{"type":"PathNode","matrix":{"m11":0.4841400176012311,"m12":0,"m21":0,"m22":0.48095238095238096,"dx":79.27057833345825,"dy":225.70238095238096},"children":[],"strokeStyle":"#000000","fillStyle":"#e1e1e1","lineWidth":4,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false},{"type":"ArrowNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":0,"dy":0},"children":[],"arrowSize":10,"path":{"type":"PathNode","matrix":{"m11":1,"m12":0,"m21":0,"m22":1,"dx":17,"dy":0},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":76,"startY":111,"closed":false,"segments":[{"type":2,"x":92,"y":143}],"shadow":false}},{"type":"PathNode","matrix":{"m11":1.3368391918073623,"m12":0,"m21":0,"m22":1.3058369941348298,"dx":-49.536534735676724,"dy":-26.230987805439646},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":126.25,"startY":127.50445838342671,"closed":true,"segments":[{"type":3,"x":146.01190476190476,"y":147.5936260519611,"x1":146.01190476190476,"y1":127.50445838342671,"r":[-0.1750196823850274,-0.05804965365678072,-0.3536788672208786,0.053223272785544395]},{"type":3,"x":126.25,"y":167.6827937204955,"x1":146.01190476190476,"y1":167.6827937204955,"r":[-0.32906053867191076,-0.11536165233701468,0.35579121299088,0.38731588050723076]},{"type":3,"x":108,"y":147,"x1":106.48809523809524,"y1":167.6827937204955,"r":[0.08825046103447676,0.011088204570114613,0.43411328736692667,-0.1330692209303379]},{"type":3,"x":126.25,"y":127.50445838342671,"x1":106.48809523809524,"y1":127.50445838342671,"r":[0.42778260353952646,0.24726040940731764,0.3631806019693613,0.05325550492852926]}],"shadow":false},{"type":"PathNode","matrix":{"m11":0.4841400176012311,"m12":0,"m21":0,"m22":0.48095238095238096,"dx":58.270578333458246,"dy":64.70238095238095},"children":[],"strokeStyle":"#000000","fillStyle":"#ffffff","lineWidth":2,"smoothness":0.3,"sloppiness":0.5,"startX":50,"startY":0,"closed":true,"segments":[{"type":3,"x":100,"y":50,"x1":100,"y1":0,"r":[-0.3779207859188318,0.07996635790914297,-0.47163885831832886,-0.07100312784314156]},{"type":3,"x":50,"y":100,"x1":100,"y1":100,"r":[0.24857700895518064,0.030472169630229473,0.49844827968627214,0.13260168116539717]},{"type":3,"x":0,"y":50,"x1":0,"y1":100,"r":[0.1751830680295825,-0.18606301862746477,-0.4092112798243761,-0.4790717279538512]},{"type":3,"x":50,"y":0,"x1":0,"y1":0,"r":[0.37117584701627493,0.3612578883767128,0.0462839687243104,-0.1564063960686326]}],"shadow":false}]}

jasmineRun()