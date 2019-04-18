//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.DB_AUTH_URL, {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {
    if (foundItems === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }else{
          console.log("Items added to DB successfully");
        }
      });
      res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const addedItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    addedItem.save((err) => {
      if (err) {
        console.log(err);
      }else {
        console.log(addedItem.name + " has been saved");
      }
    });

    res.redirect("/");
  }else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(addedItem);
      foundList.save((err) => {
        if (err) {
          console.log(err);
        }else {
          console.log(addedItem.name + " saved in list: " + foundList.name);
        }
      });
      res.redirect("/" + listName);
    });
  }


});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      }else {
          console.log("Item deleted successfully");
      }
    });
    res.redirect("/");
  }else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }


});

app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save((err) => {
          if (err) {
            console.log(err);
          }else {
            console.log(customListName + " List was created successfully");
          }
        });
        res.redirect("/" + customListName);
      }else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
      }
    }
  });





});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(port, () => {
  console.log("Server started on port: " + port);
});
