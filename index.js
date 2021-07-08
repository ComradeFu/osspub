const fs = require("fs")
const path = require("path")
const OSS = require("ali-oss")
const console = global.console

let conf = {}
let client = undefined
let base_oss_path = undefined
let base_file_path = undefined


function read_conf()
{
    try
    {
        conf = require("./.osspub")

        //black list
        if (conf.excludes)
        {
            let excludes = {}
            conf.excludes.forEach((one) =>
            {
                excludes[one] = true
            })

            conf.excludes = excludes
        }

        conf.nest = conf.nest || 20
        conf.batch = conf.batch || 10
    }
    catch (e)
    {
        throw new Error(".osspub.json file must be given in root path. see README.md.")
    }

    return conf
}

function log(...args)
{
    if (conf.logoff)
        return

    console.log(...args)
}

function is_in_backlist(file)
{
    if (!conf.excludes)
        return false

    file = path.basename(file)
    return conf.excludes[file]
}

function check_pri(file)
{
    if (!conf.files_pri)
        return

    return conf.files_pri[file]
}

async function __oss_put(file_path)
{
    let oss_path = undefined
    if (conf.remove_prefix)
    {
        let relative = path.relative(base_file_path, file_path)
        oss_path = `${base_oss_path}/${relative}`
    }
    else
    {
        oss_path = `${base_oss_path}/${file_path}`
    }

    let tags = {}

    //headers inject
    if (conf.headers)
    {
        let headers = conf.headers[file_path] || conf.headers.default
        if (headers)
        {
            tags.headers = headers
        }
    }

    await client.put(oss_path, file_path, tags)
    log(`pushed file:[${file_path}] to oss:[${oss_path}]`)
}

function oss_put(file_path, pros, white_pris = [], ignore_pri = true, nest = 0)
{
    ++nest

    if (is_in_backlist(file_path))
    {
        log(`skip file due to the blacklist:${file_path}`)
        return
    }

    if (!ignore_pri)
    {
        let pri = check_pri(file_path)
        if (pri != null)
        {
            white_pris.push({ file: file_path, pri })
            return
        }
    }

    let st = fs.statSync(file_path)
    if (st.isFile())
    {
        pros.push(__oss_put(file_path));
        return
    }
    else if (st.isDirectory())
    {
        if (nest > conf.nest)
        {
            return
        }

        let files = fs.readdirSync(file_path);
        files.forEach(
            (file) =>
            {
                let sub_file_path = `${file_path}/${file}`
                oss_put(sub_file_path, pros, white_pris, ignore_pri, nest)
            }
        )
    }
}

async function exec_pros(pros)
{
    let batch = conf.batch
    while (pros.length > 0)
    {
        let batch_pros = pros.splice(0, batch)
        await Promise.all(batch_pros)
    }
}

async function exec()
{
    let pros = []
    let wait_files = []
    oss_put(base_file_path, pros, wait_files, false)

    //throw the error 
    await exec_pros(pros)

    wait_files.sort((a, b) =>
    {
        return b.pri - a.pri
    })

    //upload one by one
    for (let one of wait_files)
    {
        let sub_pros = []
        oss_put(one.file, sub_pros)

        await exec_pros(sub_pros)
    }
}

async function main()
{
    read_conf()

    let { endpoint, accessKeyId, accessKeySecret } = conf
    if (!endpoint)
    {
        throw new Error("endpoit must be given in configuration. see README.md.")
    }

    if (!accessKeyId)
    {
        throw new Error("accessKeyId must be given in configuration. see README.md.")
    }

    if (!accessKeySecret)
    {
        throw new Error("accessKeySecret must be given in configuration. see README.md.")
    }

    let bucket = process.argv[2]
    base_oss_path = process.argv[3]
    base_file_path = process.argv[4]
    if (!bucket || !base_file_path || !base_oss_path)
    {
        throw new Error("invalid arguments count. usage: osspub ${BUCKET_NAME} ${OSS_PATH} ${LOCAL_PATH}")
    }

    client = new OSS({
        endpoint, accessKeyId, accessKeySecret, bucket,
        secure: true
    })

    console.log(`pushing oss, endpoint:${endpoint}, bucket:${bucket}`)
    console.log(`=====================================================`)

    base_oss_path = path.normalize(base_oss_path)
    base_file_path = path.normalize(base_file_path)
    await exec()

    console.log(`=====================================================`)
    console.log(`push oss finish.`)
}

main()