// shameful use of primitive global variables for now 
window.pdbID = "1crn";
window.event = "event";
window.representation = "ball+sitck";
window.colorScheme = "residueIndex";
//------------------------------------------------------------------------------------------------------------------------
HTMLWidgets.widget({

  name: 'nglShiny',
  type: 'output',

  factory: function(el, width, height) {
    console.log("manufacturing nglShiny widget");
    return {
       renderValue: function(options) {
          console.log("---- options");
          console.log(options)
          var stage;
          stage = new NGL.Stage(el);
          window.stage = stage;

          //uri = "rcsb://" + options.pdbID;
          uri = options.pdbID;
          window.pdbID = options.pdbID;
          stage.loadFile(uri, {defaultRepresentation: false}).then(function(o){
          o.autoView()
              }) // then 
          },
       resize: function(width, height) {
          console.log("entering resize");
          correctedHeight = window.innerHeight * 0.9;
          $("#nglShiny").height(correctedHeight);
          console.log("nglShiny.resize: " + width + ", " + correctedHeight + ": " + height);
          stage.handleResize()
          }
    } // return
  } // factory
});  // widget
//------------------------------------------------------------------------------------------------------------------------
function setComponentNames(x, namedComponents)
{
   console.log("--- setComponentNames");
   console.log(namedComponents);

    // stage.getComponentsByName(window.pdbID).list[0].removeAllRepresentations()

   for(name in namedComponents){
     attributes = namedComponents[name];
     var rep = attributes.representation;
     var selectionString = attributes.selection;
     console.log("name '" + name + "' for '" + selectionString + "' rep: " + rep)
     debugger;
     //stage.getComponentsByName(window.pdbID).addRepresentation(rep, {sele: selectionString,
     //                                  name: name})
     } // for name
   
   //component.addRepresentation('ball+stick', {name: 'ligand', sele: 'ligand'})
   //stage.getComponentsByName(window.pdbID).addRepresentation(rep, attributes);

} // setComponentNames
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("fit", function(message){

    console.log("nglShiny fit");
    stage.autoView();
    });

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("ligfit", function(message){

    console.log("nglShiny fit");
    stage.autoView('LIG');
    });

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("removeAllRepresentations", function(message){

    stage.getComponentsByName(window.pdbID).list[0].removeAllRepresentations()
    stage.getComponentsByName(window.pdbID).list[1].removeAllRepresentations()
    })

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("removeAllComponents", function(message){
    stage.removeAllComponents()
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setRepresentation", function(message){

    console.log("nglShiny setRepresentation")
    var rep = message;
    window.representation = rep;
    stage.getComponentsByName(window.pdbID).addRepresentation(rep)
    })

//-------------------- 
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("updateParams", function(message){
  console.log("nglShiny updateParams");
  var clipDist = message[0];
  var clipNear = message[1];
  var clipFar  = message[2];
  var fogNear  = message[3];
  var fogFar   = message[4];
  stage.setParameters({
    'clipDist': clipDist,
    'clipNear': clipNear,
    'clipFar': clipFar,
    'fogNear': fogNear,
    'fogFar': fogFar,
  });
})

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setColorScheme", function(message){

    console.log("nglShiny setColorScheme")
    var newScheme = message[0];
    window.colorScheme = newScheme;
    console.log("new scheme: " + newScheme);
    // debugger;
    stage.getComponentsByName(window.pdbID).addRepresentation(window.representation, {colorScheme: newScheme})
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setPDB", function(message){
    stage.removeAllComponents()
    window.pdbID = message[0];
    console.log("nglShiny setPDB: " + window.pdbID)
    //var url = "rcsb://" + window.pdbID;
    var url = window.pdbID;
    stage.loadFile(url).then(function(comp){
      comp.addRepresentation("ball+stick", {colorScheme: "residueIndex"});
      })
       // redundant?
    stage.getComponentsByName(window.pdbID).addRepresentation(window.representation, {colorScheme: window.colorScheme})
    stage.autoView()
    })


if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setPDB2", function(message){
    stage.removeAllComponents();
    // Assumption, message is R list of n objects
    var pdb = message[0];
    //var window.pdbID = 'structure';
    var stringBlob = new Blob( [ pdb ], { type: 'text/plain'} );
    console.log("nglShiny setPDB2:");
    stage.setParameters({'clipNear':parseFloat(message[2]), 'clipFar':parseFloat(message[3]), 'clipDist':parseFloat(message[1]), 'fogNear':parseFloat(message[4]), 'fogFar':parseFloat(message[5])});  
    stage.loadFile(stringBlob, { ext: "pdb" }).then(function (comp) {
      comp.addRepresentation("ball+stick", {sele: "not (water or ion)"}); //, {sele: "ATOM"}); // Only show what is in protein
      comp.addRepresentation("ball+stick", 
        {
        sele: "LIG", 
        //aspectRatio: 3,//,
        colorValue: "limegreen"
        }); // Only show what is in ligand
      comp.addRepresentation("contact", {sele: "not (water or ion)"});
      comp.autoView("LIG");  
      //comp.setParameters({'clipNear':42, 'clipFar':100, 'clipDist':10, 'fogNear':50, 'fogFar':62});   
    });
});

if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("addEvent", function(message){
  //var window.event = message;
  var isTrueSet = (message[3] === 'true');
  var byteCharacters = atob(message[0]);
  var byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  };
  var byteArray = new Uint8Array(byteNumbers);
  var blob = new Blob([byteArray], {type: 'application/octet-binary'});
    stage.loadFile( blob, { ext: message[4] } ).then(function (comp) {
      shell = comp.addRepresentation("surface", { color: message[2], 
                                                  isolevel: parseFloat(message[1]), 
                                                  negateIsolevel: isTrueSet,
                                                  boxSize:parseFloat(message[5]), useWorker: false, contour:true, wrap:true});
    });
    // redundant?
    //stage.getComponentsByName(window.pdbID).addRepresentation(window.representation, {colorScheme: window.colorScheme})
    //stage.autoView()
});

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("select", function(message){

    residueString = message[0];
    console.log("nglShiny select: " + residueString)
    stage.getComponentsByName(window.pdbID).addRepresentation("ball+stick", {sele: residueString})
    //stage.getComponentsByName(window.pdbID).addRepresentation("ball+stick", {sele: "23, 24, 25, 26, 27, 28, 29, 30"})
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("showSelection", function(message){

    //residueString = message[0];
    var rep = message.representation;
    var selection = message.selection;
    var colorScheme = message.colorScheme;
    var name = message.name;
    var attributes = {sele: selection, colorScheme: colorScheme, name: name};
    console.log("attributes")
    console.log(attributes)
    console.log("nglShiny showSelection: " + rep + ",  " + selection);
    //stage.getComponentsByName(window.pdbID).addRepresentation(rep, {sele: selection, colorScheme: colorScheme, name: name})
    stage.getComponentsByName(window.pdbID).addRepresentation(rep, attributes);
    // stage.getComponentsByName('1ztu').addRepresentation('ball+stick', {sele: 'not helix and not sheet and not turn and not water'})
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setVisibility", function(message){

    var repName = message.representationName;
    var newState = message.newState;
    console.log("set visibility " + repName + "  " + newState)
    stage.getRepresentationsByName(repName).setVisibility(newState)
    })

//------------------------------------------------------------------------------------------------------------------------
