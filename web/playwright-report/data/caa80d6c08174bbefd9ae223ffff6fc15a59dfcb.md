# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: localization.spec.ts >> Localization Checks >> should translate dashboard to ta
- Location: tests\e2e\localization.spec.ts:23:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "காலை வணக்கம்"
Received string:    "<!DOCTYPE html><html lang=\"en\" class=\"h-full\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><link rel=\"preload\" href=\"/_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2\" as=\"font\" crossorigin=\"\" type=\"font/woff2\"><link rel=\"stylesheet\" href=\"/_next/static/chunks/0exbb3._ofa8b.css\" data-precedence=\"next\"><link rel=\"preload\" as=\"script\" fetchpriority=\"low\" href=\"/_next/static/chunks/0-4oo_oi06i0r.js\"><script src=\"/_next/static/chunks/0s8pg.v9c1td-.js\" async=\"\"></script><script src=\"/_next/static/chunks/0u2dwf9huke-l.js\" async=\"\"></script><script src=\"/_next/static/chunks/0ut368zci8muk.js\" async=\"\"></script><script src=\"/_next/static/chunks/0pqt~8bl3ukh4.js\" async=\"\"></script><script src=\"/_next/static/chunks/turbopack-0xwmrq1t6i5p2.js\" async=\"\"></script><script src=\"/_next/static/chunks/12oyem70f87tt.js\" async=\"\"></script><script src=\"/_next/static/chunks/0p8xcdnrhh8r..js\" async=\"\"></script><script src=\"/_next/static/chunks/0ibo_peqsgs7..js\" async=\"\"></script><script src=\"/_next/static/chunks/0y1qsqj_mic25.js\" async=\"\"></script><script src=\"/_next/static/chunks/0-lge.2k~ofsb.js\" async=\"\"></script><script src=\"/_next/static/chunks/0n4z.7yu76je-.js\" async=\"\"></script><script src=\"/_next/static/chunks/0pwt_ww5gev.h.js\" async=\"\"></script><script src=\"/_next/static/chunks/0afx3ca9o6zk..js\" async=\"\"></script><script src=\"/_next/static/chunks/0ffs5mfh0~3rz.js\" async=\"\"></script><meta name=\"next-size-adjust\" content=\"\"><meta name=\"theme-color\" content=\"#10b981\"><title>AgroRent Admin Dashboard</title><meta name=\"description\" content=\"Manage your farm equipment and bookings\"><link rel=\"manifest\" href=\"/manifest.json\"><link rel=\"icon\" href=\"/favicon.ico?favicon.0x3dzn~oxb6tn.ico\" sizes=\"256x256\" type=\"image/x-icon\"><script src=\"/_next/static/chunks/03~yq9q893hmn.js\" nomodule=\"\"></script></head><body class=\"inter_5972bc34-module__OU16Qa__className h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100\"><div hidden=\"\"><!--$--><!--/$--></div><div class=\"min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900\"><div class=\"flex flex-col items-center\"><div class=\"animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500\"></div><p class=\"mt-4 text-gray-500 font-medium\">Loading AgroRent AI...</p></div></div><div class=\"fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full sm:w-auto\"></div><script src=\"/_next/static/chunks/0-4oo_oi06i0r.js\" id=\"_R_\" async=\"\"></script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,\"1:\\\"$Sreact.fragment\\\"\\n2:I[46417,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"ErrorBoundary\\\"]\\n3:I[59919,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"default\\\"]\\n4:I[76972,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"ToastProvider\\\"]\\n5:I[90464,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"default\\\"]\\n6:I[39756,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"default\\\"]\\n7:I[37457,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"default\\\"]\\n8:I[79520,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"\\\"]\\n9:I[92825,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"ClientSegmentRoot\\\"]\\na:I[39126,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\",\\\"/_next/static/chunks/0pwt_ww5gev.h.js\\\"],\\\"default\\\"]\\nc:I[47257,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"ClientPageRoot\\\"]\\nd:I[52160,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\",\\\"/_next/static/chunks/0pwt_ww5gev.h.js\\\",\\\"/_next/static/chunks/0afx3ca9o6zk..js\\\",\\\"/_next/static/chunks/0ffs5mfh0~3rz.js\\\"],\\\"default\\\"]\\n10:I[97367,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"OutletBoundary\\\"]\\n11:\\\"$Sreact.suspense\\\"\\n14:I[97367,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"ViewportBoundary\\\"]\\n16:I[97367,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"MetadataBoundary\\\"]\\n19:I[68027,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj\"])</script><script>self.__next_f.push([1,\"_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"default\\\",1]\\n:HL[\\\"/_next/static/chunks/0exbb3._ofa8b.css\\\",\\\"style\\\"]\\n:HL[\\\"/_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2\\\",\\\"font\\\",{\\\"crossOrigin\\\":\\\"\\\",\\\"type\\\":\\\"font/woff2\\\"}]\\n\"])</script><script>self.__next_f.push([1,\"0:{\\\"P\\\":null,\\\"c\\\":[\\\"\\\",\\\"dashboard\\\",\\\"farmer\\\"],\\\"q\\\":\\\"\\\",\\\"i\\\":false,\\\"f\\\":[[[\\\"\\\",{\\\"children\\\":[\\\"dashboard\\\",{\\\"children\\\":[\\\"farmer\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{}]}]}]},\\\"$undefined\\\",\\\"$undefined\\\",16],[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0exbb3._ofa8b.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-2\\\",{\\\"src\\\":\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-3\\\",{\\\"src\\\":\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-4\\\",{\\\"src\\\":\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-5\\\",{\\\"src\\\":\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"en\\\",\\\"className\\\":\\\"h-full\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"className\\\":\\\"inter_5972bc34-module__OU16Qa__className h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100\\\",\\\"children\\\":[[\\\"$\\\",\\\"$L2\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L3\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L4\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L5\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontFamily\\\":\\\"system-ui,\\\\\\\"Segoe UI\\\\\\\",Roboto,Helvetica,Arial,sans-serif,\\\\\\\"Apple Color Emoji\\\\\\\",\\\\\\\"Segoe UI Emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textAlign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexDirection\\\":\\\"column\\\",\\\"alignItems\\\":\\\"center\\\",\\\"justifyContent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontSize\\\":24,\\\"fontWeight\\\":500,\\\"verticalAlign\\\":\\\"top\\\",\\\"lineHeight\\\":\\\"49px\\\"},\\\"children\\\":404}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontSize\\\":14,\\\"fontWeight\\\":400,\\\"lineHeight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]],[]],\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]}]}]}]}],[\\\"$\\\",\\\"$L8\\\",null,{\\\"id\\\":\\\"register-sw\\\",\\\"strategy\\\":\\\"afterInteractive\\\",\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"\\\\n              if ('serviceWorker' in navigator) {\\\\n                window.addEventListener('load', function() {\\\\n                  navigator.serviceWorker.register('/sw.js').then(\\\\n                    function(registration) {\\\\n                      console.log('Service Worker registration successful with scope: ', registration.scope);\\\\n                    },\\\\n                    function(err) {\\\\n                      console.log('Service Worker registration failed: ', err);\\\\n                    }\\\\n                  );\\\\n                });\\\\n              }\\\\n            \\\"}}]]}]}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0pwt_ww5gev.h.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"$L9\\\",null,{\\\"Component\\\":\\\"$a\\\",\\\"slots\\\":{\\\"children\\\":[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]},\\\"serverProvidedParams\\\":{\\\"params\\\":{},\\\"promises\\\":[\\\"$@b\\\"]}}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L6\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L7\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[\\\"$\\\",\\\"$Lc\\\",null,{\\\"Component\\\":\\\"$d\\\",\\\"serverProvidedParams\\\":{\\\"searchParams\\\":{},\\\"params\\\":\\\"$0:f:0:1:1:children:0:props:children:1:props:serverProvidedParams:params\\\",\\\"promises\\\":[\\\"$@e\\\",\\\"$@f\\\"]}}],[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0afx3ca9o6zk..js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/0ffs5mfh0~3rz.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"$L10\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$11\\\",null,{\\\"name\\\":\\\"Next.MetadataOutlet\\\",\\\"children\\\":\\\"$@12\\\"}]}]]}],{},null,false,null]},null,false,\\\"$@13\\\"]},null,false,null]},null,false,null],[\\\"$\\\",\\\"$1\\\",\\\"h\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L14\\\",null,{\\\"children\\\":\\\"$L15\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"hidden\\\":true,\\\"children\\\":[\\\"$\\\",\\\"$L16\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$11\\\",null,{\\\"name\\\":\\\"Next.Metadata\\\",\\\"children\\\":\\\"$L17\\\"}]}]}],\\\"$L18\\\"]}],false]],\\\"m\\\":\\\"$undefined\\\",\\\"G\\\":[\\\"$19\\\",[\\\"$L1a\\\"]],\\\"S\\\":true,\\\"h\\\":null,\\\"s\\\":\\\"$undefined\\\",\\\"l\\\":\\\"$undefined\\\",\\\"p\\\":\\\"$undefined\\\",\\\"d\\\":\\\"$undefined\\\",\\\"b\\\":\\\"IQCO5MlnWbQ3EVQrsUNEj\\\"}\\n\"])</script><script>self.__next_f.push([1,\"1b:[]\\n13:\\\"$W1b\\\"\\n18:[\\\"$\\\",\\\"meta\\\",null,{\\\"name\\\":\\\"next-size-adjust\\\",\\\"content\\\":\\\"\\\"}]\\n1a:[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/0exbb3._ofa8b.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}]\\nb:\\\"$0:f:0:1:1:children:0:props:children:1:props:serverProvidedParams:params\\\"\\ne:{}\\nf:\\\"$0:f:0:1:1:children:0:props:children:1:props:serverProvidedParams:params\\\"\\n\"])</script><script>self.__next_f.push([1,\"15:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"charSet\\\":\\\"utf-8\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"2\\\",{\\\"name\\\":\\\"theme-color\\\",\\\"content\\\":\\\"#10b981\\\"}]]\\n\"])</script><script>self.__next_f.push([1,\"1c:I[27201,[\\\"/_next/static/chunks/12oyem70f87tt.js\\\",\\\"/_next/static/chunks/0p8xcdnrhh8r..js\\\",\\\"/_next/static/chunks/0ibo_peqsgs7..js\\\",\\\"/_next/static/chunks/0y1qsqj_mic25.js\\\",\\\"/_next/static/chunks/0-lge.2k~ofsb.js\\\",\\\"/_next/static/chunks/0n4z.7yu76je-.js\\\"],\\\"IconMark\\\"]\\n12:null\\n17:[[\\\"$\\\",\\\"title\\\",\\\"0\\\",{\\\"children\\\":\\\"AgroRent Admin Dashboard\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"Manage your farm equipment and bookings\\\"}],[\\\"$\\\",\\\"link\\\",\\\"2\\\",{\\\"rel\\\":\\\"manifest\\\",\\\"href\\\":\\\"/manifest.json\\\",\\\"crossOrigin\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"link\\\",\\\"3\\\",{\\\"rel\\\":\\\"icon\\\",\\\"href\\\":\\\"/favicon.ico?favicon.0x3dzn~oxb6tn.ico\\\",\\\"sizes\\\":\\\"256x256\\\",\\\"type\\\":\\\"image/x-icon\\\"}],[\\\"$\\\",\\\"$L1c\\\",\\\"4\\\",{}]]\\n\"])</script></body></html>"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - link "AgroRent AI Farmer Portal" [ref=e5]:
          - /url: /
          - generic [ref=e6]: AgroRent AI
          - generic [ref=e7]: Farmer Portal
        - button [ref=e8] [cursor=pointer]:
          - img [ref=e9]
      - generic [ref=e12]:
        - link "டாஷ்போர்டு" [ref=e13]:
          - /url: /dashboard/farmer
          - img [ref=e14]
          - generic [ref=e19]: டாஷ்போர்டு
        - link "சந்தை" [ref=e20]:
          - /url: /dashboard/marketplace
          - img [ref=e21]
          - generic [ref=e24]: சந்தை
        - link "எனது வாடகைகள்" [ref=e25]:
          - /url: /dashboard/farmer#rentals
          - img [ref=e26]
          - generic [ref=e28]: எனது வாடகைகள்
        - link "பயிர் வழிகாட்டிகள்" [ref=e29]:
          - /url: /dashboard/guides
          - img [ref=e30]
          - generic [ref=e32]: பயிர் வழிகாட்டிகள்
        - link "AI ஆலோசகர்" [ref=e33]:
          - /url: /dashboard/ai-advisor
          - img [ref=e34]
          - generic [ref=e37]: AI ஆலோசகர்
        - link "Notifications" [ref=e38]:
          - /url: /dashboard/notifications
          - img [ref=e39]
          - generic [ref=e42]: Notifications
      - link "சுயவிவரம் & அமைப்புகள்" [ref=e44]:
        - /url: /dashboard/profile
        - img [ref=e45]
        - generic [ref=e48]: சுயவிவரம் & அமைப்புகள்
    - generic [ref=e49]:
      - banner [ref=e50]:
        - button [ref=e52] [cursor=pointer]:
          - img [ref=e53]
        - generic [ref=e54]:
          - button "Language" [ref=e56] [cursor=pointer]:
            - img [ref=e57]
          - button [ref=e60] [cursor=pointer]:
            - img [ref=e61]
          - link [ref=e63]:
            - /url: /dashboard/notifications
            - img [ref=e64]
          - link "T" [ref=e69]:
            - /url: /dashboard/profile
      - main [ref=e70]
  - alert [ref=e79]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Localization Checks', () => {
  4  | 
  5  |   const languages = [
  6  |     { code: 'en', id: 'lang-en', expected: 'Good Morning' },
  7  |     { code: 'te', id: 'lang-te', expected: 'శుభోదయం' },
  8  |     { code: 'hi', id: 'lang-hi', expected: 'सुप्रभात' },
  9  |     { code: 'ta', id: 'lang-ta', expected: 'காலை வணக்கம்' },
  10 |     { code: 'kn', id: 'lang-kn', expected: 'ಶುಭೋದಯ' },
  11 |   ];
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
  14 |     // Login before each test to see the dashboard
  15 |     await page.goto('/login');
  16 |     await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
  17 |     await page.locator('input[type="password"]').fill('password123');
  18 |     await page.getByTestId('login-button').click();
  19 |     await expect(page).toHaveURL(/\/dashboard/);
  20 |   });
  21 | 
  22 |   for (const lang of languages) {
  23 |     test(`should translate dashboard to ${lang.code}`, async ({ page }) => {
  24 |       // Open language switcher
  25 |       await page.getByTestId('language-switcher').click();
  26 |       
  27 |       // We will select by role 'menuitem' that contains the specific data-testid
  28 |       // The LanguageSwitcher maps: english->lang-en, etc. We can just click the exact one if we injected `language-select` correctly.
  29 |       // Wait, in LanguageSwitcher, we gave individual options data-testid="language-select". We can click by text content.
  30 |       const langOption = page.locator(`[data-testid="language-select"]`).filter({ hasText: new RegExp(lang.code, 'i') }).first();
  31 |       // If the above filter fails, let's use a simpler evaluate to set language
  32 |       await page.evaluate((code) => {
  33 |         window.localStorage.setItem('i18nextLng', code);
  34 |       }, lang.code);
  35 |       
  36 |       await page.reload();
  37 |       
  38 |       // Verify visual translation
  39 |       const textContent = await page.content();
> 40 |       expect(textContent).toContain(lang.expected);
     |                           ^ Error: expect(received).toContain(expected) // indexOf
  41 | 
  42 |       // Visual snapshot
  43 |       await expect(page).toHaveScreenshot(`dashboard-${lang.code}.png`, { fullPage: true, maxDiffPixelRatio: 0.1 });
  44 |     });
  45 |   }
  46 | 
  47 | });
  48 | 
```